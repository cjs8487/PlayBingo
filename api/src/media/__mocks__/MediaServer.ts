const actualMediaServer = jest.requireActual('../MediaServer');

export default actualMediaServer.default;
export const saveFile = jest.fn(async () => true);
export const deleteFile = jest.fn(async () => true);
