import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { FileArray, UploadedFile } from "express-fileupload";
import { Server, ServerOptions } from 'socket.io'
import { Collection, ObjectId } from 'mongodb';
import multer from 'multer';
import { DB } from '../db';
import GBRoutines from "./routines";
import { CLIENT_DEFAULT_HOST, IMAGE_DEFAULT_DIR, Sockets } from '.';
import jwt from 'jsonwebtoken';
import { SECRET } from '../interfaces';
import { log } from '../logger/log';
// export const device = require('express-device')
// import fpath from 'path'

export const gbr = GBRoutines;

export function getMinMax(arr: Array<any>) {
  return arr.reduce(({ min, max }, v) => ({
    min: min < v ? min : v,
    max: max > v ? max : v,
  }), { min: arr[0], max: arr[0] });
}

export function missNoArray(numbers: Array<number>) {
  let missing = [];
  let arrayLength = numbers.length
  // Find the missing array items
  for (var i = 0; i < arrayLength; i++) {
    if (numbers.indexOf(i) < 0) {
      missing.push(i);
    }
  }

  return missing
}

export const jsonStatusError = {
  "error": {
    "errors": [
      {
        "domain": "global",
        "reason": "required",
        "message": "Login Required",
        "locationType": "header",
        "location": "Authorization"
      }
    ],
    "code": 401,
    "message": "Login Required"
  }
}

// We are assuming that the JWT will come in the header Authorization but it could come in the req.body or in a query param, you have to decide what works best for you.
export const getTokenFromHeader = (req: any) => {

  const authHeader = req.headers['authorization']

  const token = authHeader && authHeader.split(' ')[0] === 'Bearer' && authHeader.split(' ')[1]
  // log(`jwt token: ` + req.token)
  return token

}

export const isAuth = (req: any, res: any, next: any) => {


  log('User Session req auth ', req && req.user ? req.user : 'req.user node defined');

  log(`auth session passport ${req.isAuthenticated()}`, req.session.passport);

  // Cookies that have not been signed
  log(`req.signedCookies ${req.sessionID}`/* , req.signedCookies */)
  // log('req.cookies`, req.cookies)


  // let isAuthenticated = () => req.session.passport && req.session.passport.user? true : false

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  else return res.status(401).json(jsonStatusError);
}


// When you generate a new JWT token, as the request is going to continue to next middleware step, 
// probably you will need to set the user, same as you do 
// when the jwt is correct. Something like this, try it, and let me know if it helps:
export const isJwtAuth = async (req: Request, res: Response, next: NextFunction) => {

  try {

    // if user is authenticated in the session, carry on
    const token = getTokenFromHeader(req)
    if (!token) return res.status(401).json(jsonStatusError)

    const user = await jwt.verify(token, SECRET as string)


    // log('isJwtAuth user: `, user)
    // log('req.signedCookies ${req.sessionID}`/* , req.signedCookies */)
    req.user = user
    return next()

  } catch (e: any) {
    log(`isJwtAuth ->` + e)
    return res.status(403).json(jsonStatusError)
  }
}

export const isJwtAuthWithPassport = (req: Request, res: Response, next: NextFunction) => {

  return passport.authenticate('jwt', { session: false }, (err: any, jwtPayload: any) => {

    if (err || !jwtPayload)
      return res.status(401).json(jsonStatusError)
    // if user is authenticated in the session, carry on
    // search for Redis Store session
    const token = getTokenFromHeader(req)
    if (!token) return res.status(401).json(jsonStatusError)

    log(`req.signedCookies ${req.sessionID}`/* , req.signedCookies */)


    // log(`req.cookies`, req.cookies)

    // if user is authenticated in the session, carry on
    if (token) return next();
  })(req, res, next)
}

// export const isBearerAuthenticated = passport.authenticate('jwt-bearer', { session: false });

export function fileImgError(files: FileArray | undefined | null) {

  let err: boolean = (files !== null && !files) || (files !== null && Object.keys(files).length === 0)
  console.log(files, err)
  return err
}

// Use the mv() method to place the file somewhere on your server
export const storagePath = (avatarFile: UploadedFile | null, path: string): string => (!avatarFile ? '' : (path + avatarFile.name))

export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGE_DEFAULT_DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, fileName)
  }
});

// Multer Mime Type Validation
export let upload = multer({
  storage: storage,
  //   limits: {
  //     fileSize: 1024 * 1024 * 5
  //   },
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false)
      let k = new Error('Only .png, .jpg and .jpeg format allowed!')
      // return cb(k, true)
    }
  }
})


export async function createBookCase(newBookCase: any, bookId: number): Promise<any> {

  try {

    // Check DB Connection
    if (!DB.isConnected()) { // trying to reconnect
      await DB.connect();
    } else {
      let dbCollection: Collection = DB.getCollection('bookcase')
      newBookCase.bookId = new ObjectId(bookId)
      dbCollection.insertMany(newBookCase, (err: any, result: any) => {
        if (err) { return { code: 500, status: 'error', error: err } }

        return {
          code: 200,
          status: 'success',
          data: {
            result,
            message: `bookcase saved successful! `
          }
        }
      })
    }
  } catch (error) {
    console.error(error)
    return { code: 500, status: 'error', error: error }
  }
}


export function popByKey(myArray: any[], key: string) {

  const index = myArray.indexOf(key, 0);
  if (index > -1) {
    myArray.splice(index, 1);
  }
}

export function shiftRsortNo(myArray: any[], key: number) {

  let k = myArray

  for (let i = key, arr; arr = k[i]; i++) {
    arr.bookshelfNo += 1
  }
}

export function shiftLsortNo(myArray: any[], key: number) {

  let k = myArray

  for (let i = key, arr; arr = k[i]; i++) {
    arr.bookshelfNo -= 1
  }
}

export function shiftRByKey(myArray: any[], index: number, value: any) {

  if (index > -1) {
    myArray.splice(index, 0, value);
  }
}

export function shiftLByKey(myArray: any[], index: number, value: any) {

  if (index > -1) {
    myArray.splice(index, 1);
  }
}

// USE SOCKET IO
export function sockAttach(server: any, opt?: ServerOptions | undefined): void {

  let socketObject: Sockets = new Sockets()
  socketObject.attach(new Server(server, {
    cors: {
      origin: CLIENT_DEFAULT_HOST,
      methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["secretHeader"],
      credentials: true
    }
  }))
}

export function dateFormatSystem(current_datetime: Date): Date {

  let formatted_date: string = current_datetime.getFullYear() + "-" +
    (current_datetime.getMonth() + 1) + "-" +
    current_datetime.getDate() + " " +
    current_datetime.getHours() + ":" +
    current_datetime.getMinutes() + ":" +
    current_datetime.getSeconds()
  // console.log(formatted_date)

  return new Date(formatted_date)
}