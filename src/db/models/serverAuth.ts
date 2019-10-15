import { Timestamp } from 'bson'

export const SECRET = 'MySuP3R_z3kr3t!'

export interface Code {
    _id?: string,
    value: string,
    redirectUri: string,
    userId: string,
    clientId: string
    ts?: Timestamp
}

export interface Token {
    _id?: string,
    value: string,
    userId: string,
    clientId: string
    ts?: Timestamp
}

export interface Client {
    _id?: any;
    name: string,
    secret: string,
    userId: string,
    ts?: Timestamp
}

export interface User {
    _id?: string,
    username: string,
    password: string,
    tokenId: string,
    clientId: string
}