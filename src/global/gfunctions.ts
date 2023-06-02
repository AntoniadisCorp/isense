import passport from 'passport';
import { GBRoutines } from "./routines";
import multer from 'multer';
import { UploadedFile } from "express-fileupload";
export const randtoken = require('rand-token')
// export const device = require('express-device')
export const gbr = new GBRoutines();
import fpath from 'path'
import { NextFunction } from "express";
import { DB } from '../db';
// import { Collection, ObjectId } from 'mongodb';
import { Server, ServerOptions } from 'socket.io'

import { CLIENT_DEFAULT_HOST, Sockets } from '.';
import { IMAGE_DEFAULT_DIR } from '../db/models';
import { Collection, ObjectId } from 'mongodb';

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
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
}

export const isAuth = (req: any, res: any, next: any) => {


  console.log('User Session req auth ', req && req.user ? req.user : 'req.user node defined');

  console.log(`auth session passport ${req.isAuthenticated()}`, req.session.passport);

  // Cookies that have not been signed
  console.error(`req.signedCookies ${req.sessionID}`/* , req.signedCookies */)
  // console.error(`req.cookies`, req.cookies)


  // let isAuthenticated = () => req.session.passport && req.session.passport.user? true : false

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  else return res.status(401).json(jsonStatusError);
}


export const isJwtAuth = (req: any, res: any, next: NextFunction) => {

  return passport.authenticate('jwt', { session: false }, (err: any, jwtPayload: any) => {

    if (err || !jwtPayload)
      return res.status(401).json(jsonStatusError);

    // if user is authenticated in the session, carry on
    const token = getTokenFromHeader(req)
    console.error(`JWT TOKEN FROM HEADER auth: `)

    console.error(`req.signedCookies ${req.sessionID}`/* , req.signedCookies */)
    // console.error(`req.cookies`, req.cookies)

    // if user is authenticated in the session, carry on
    if (token) return next();
  })(req, res, next)
}

export const isBearerAuthenticated = passport.authenticate('jwt-bearer', { session: false });


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