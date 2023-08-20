import { SocketOptions, io } from 'socket.io-client';
import { getUserSettings } from './functions/localstorage';

const web3UserId= getUserSettings().web3UserId
const options:SocketOptions=web3UserId?{auth:{web3UserId}}:{}
// Connect to websocket server on localhost
export const socket = io("",options);