export const PiecesConnectionCheck = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]): Promise<any> {
    try {
      // @ts-ignore
      const connectionStatus = await this.checkPiecesConnection();
      if (!connectionStatus.connected) {
        throw new Error('Not connected to Pieces');
      }
      return await originalMethod.apply(this, args);
    } catch (error) {
      console.error('Error connecting to Pieces', error);
      // Provide an alternative response or handle the error appropriately
      return { error: 'Failed to connect to Pieces' };
    }
  };
  return descriptor;
};
