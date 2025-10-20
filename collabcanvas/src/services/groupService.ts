import { collection, doc, setDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { shapeService } from './shapeService';
import type { GroupData } from './types/canvasTypes';

class GroupService {
  /**
   * Get shapes collection path for a specific canvas
   */
  private getShapesPath(canvasId: string): string {
    return `canvases/${canvasId}/shapes`;
  }

  /**
   * Get groups collection path for a specific canvas
   */
  private getGroupsPath(canvasId: string): string {
    return `canvases/${canvasId}/groups`;
  }

  async groupShapes(canvasId: string, shapeIds: string[], userId: string, name?: string): Promise<string> {
    try {
      if (shapeIds.length < 2) {
        throw new Error('At least 2 shapes are required to create a group');
      }

      const shapes = await shapeService.getShapes(canvasId);
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
      
      const shapesToGroup = shapes.filter(s => shapeIds.includes(s.id));
      shapesToGroup.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      const groupsPath = this.getGroupsPath(canvasId);
      const groupId = doc(collection(firestore, groupsPath)).id;
      
      const groupData: Omit<GroupData, 'id'> = {
        name: name || `Group ${groupId.slice(0, 6)}`,
        shapeIds,
        createdBy: userId,
        createdAt: serverTimestamp() as Timestamp,
      };

      const groupRef = doc(firestore, groupsPath, groupId);
      await setDoc(groupRef, groupData);

      const batch = writeBatch(firestore);
      const shapesPath = this.getShapesPath(canvasId);
      
      shapesToGroup.forEach((shape, index) => {
        const newZIndex = maxZIndex + 1 + index;
        const shapeRef = doc(firestore, shapesPath, shape.id);
        batch.update(shapeRef, {
          groupId,
          zIndex: newZIndex,
          updatedAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
      
      return groupId;
    } catch (error) {
      console.error('❌ Error creating group:', error);
      throw error;
    }
  }

  async ungroupShapes(canvasId: string, groupId: string): Promise<void> {
    try {
      const groupsPath = this.getGroupsPath(canvasId);
      const groupRef = doc(firestore, groupsPath, groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupSnap.data() as GroupData;
      
      const batch = writeBatch(firestore);
      const shapesPath = this.getShapesPath(canvasId);
      
      for (const shapeId of groupData.shapeIds) {
        const shapeRef = doc(firestore, shapesPath, shapeId);
        batch.update(shapeRef, {
          groupId: null,
          updatedAt: serverTimestamp(),
        });
      }
      
      batch.delete(groupRef);
      
      await batch.commit();
    } catch (error) {
      console.error('❌ Error ungrouping shapes:', error);
      throw error;
    }
  }

  async getGroup(canvasId: string, groupId: string): Promise<GroupData | null> {
    try {
      const groupsPath = this.getGroupsPath(canvasId);
      const groupRef = doc(firestore, groupsPath, groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        return null;
      }

      return {
        id: groupSnap.id,
        ...groupSnap.data(),
      } as GroupData;
    } catch (error) {
      console.error('❌ Error fetching group:', error);
      return null;
    }
  }
}

export const groupService = new GroupService();
export default GroupService;
