import express, {Request,Response,NextFunction, Router} from 'express'
import { Emailer, GBRoutines, debug } from '../global'
import {machineId, machineIdSync} from 'node-machine-id';

// import { mainRouter } from './'
import { authfun as auth } from './auth'
import { DB, jdb } from '../db/net'
import { ICategory, Category } from '../db/models'
/* import { Mongoose, mongo } from 'mongoose'; */
import { ObjectID, ObjectId } from 'bson';
import { Collection } from 'mongodb';
let device = require('express-device')
let gbr = new GBRoutines();

interface tk103Device {
    
    oldpass: string
}

/* 
    Most Important Tasks, Main Tasks
*/
class Tasks {

    public router: Router
    public tk103: tk103Device
    constructor() {


        this.tk103 = {oldpass:''}
        this.router = express.Router()
        this.router.use(device.capture())
        this.httpRoutesGets()
        this.httpRoutesPosts()
    }

    
    // Node JS Routes

    /**
     * https Router Gets
     */

    httpRoutesGets(): void {

        this.router.get('/', (req:Request, res:Response) => {
            let d = {  tasks: 'Task 1!' }
            console.log(d.tasks)
            res.send(d)
          })
        
        this.router.get('/categories', this.getTasks); // Get All Tasks
        this.router.get('/categories/search', this.SearchTasks); // Search All Categories
        this.router.get('/:id', this.OneTask); // Get Single task
    }

    /**
     * https Router Posts
     */

    httpRoutesPosts(): void {

        // this.router.post('/emails', this.sendEmail) // send email
        // this.router.post('/subscribers', this.sub) // subscribe
        this.router.post('/save', this.savetask); // Save task
        this.router.post('/del', this.deletetask); // Update/Delete Tasks
    }

    /**
     * https Router Delete
     */

    httpRoutesDelete(): void {

        // this.router.delete('/:id', this.deletetask); // Delete task
    }

    /**
     * https Router Put - update
     */

    httpRoutesPut(): void {

        this.router.put('/:id', auth, this.updatetask); // Update task
        // this.router.put('/resetpass/:id', auth, this.resetpassword); // update password of the device

    }

    /**
     * Router Functions
     */

    // if the user is authenticated redirect to home
    // ---------- https Functions ToDo ----------
    getTasks(req:Request, res:Response, next:NextFunction) {
        
        let dbCollection: Collection = DB.getCollection('category');
        dbCollection.find({recyclebin: false}).limit(100).toArray((err:any, categories: any) => {

            if (err) res.status(500).json(err)
            if (debug.explain) console.log(categories)
            res.status(200).json(gbr.getNestedChildren(categories));
        });
        
    }

    SearchTasks(req: Request, res: Response, next: NextFunction) {

        
        let sterm = req.query

        const regex = new RegExp(gbr.escapeRegex(sterm.q), 'gi');
        let dbCollection:Collection = DB.getCollection('category');

        dbCollection.find(
                {"name": {$regex: regex}, recyclebin: false}).limit(10).toArray(
                (err:any, searchRes: ICategory[]) => {
                    // callback
                    if(err) {
                        console.error(err)
                        return next(err);
                    }
                    if (debug.explain) console.log(searchRes)
                    res.status(200).json(searchRes)
                }
            )
    }

    OneTask(req:Request, res:Response, next:NextFunction) {

        let dbCollection: Collection = DB.getCollection('category');

        dbCollection.findOne({ _id: new ObjectId(req.params.id), recyclebin: false }, (err:any, results:any) => {
            if(err) {
                return next(err);
            }
            res.status(200).json({ results })
        });
    }

    savetask(req:Request, res:Response, next:NextFunction) {
        
        let json_obj = req.body,
        top = json_obj.parent_id.length>0? false: true,
        newobj = {
                _id: new ObjectId().toHexString(),
                name: json_obj.name,
                desc: 1,
                icon: json_obj.icon,
                parent_id: json_obj.parent_id,
                status: true,
                top: top,
                date_added: new Date()
            },
            dbCollection:Collection = DB.getCollection('category');
            
            dbCollection.save(newobj, (err:any) => {
                    if(err) {
                        res.status(500).json({error: err});
                    }
                    res.status(200).json({ code: 200, status: "success" });
                });
        
    }
    
    deletetask(req:Request, res:Response, next:NextFunction) {

        let sterm = req.body,
            arr: string[] = sterm.q? sterm.q : [];
        
        if (arr.length > 0) {
            console.log(arr)
            
            let dbCollection:Collection = DB.getCollection('Category')
            
            dbCollection.updateMany(
                {'_id':{'$in': arr}},
                { $set: { recyclebin : true } },
                (err:any) => {
                    if(err) {
                        res.status(500).json({error: err});
                    }
                    res.status(200).json({ code: 200, status: "success" });
                }
            )
           
        } else { res.status(500).json({ code: 500, status: "failed" }); }
    }
    
    updatetask(req:Request, res:Response, next:NextFunction) {
    
        var task = req.body,
            updTask = {isDone:true,title:''};
        // const mycollection = client.db(dbname).collection('product')

        if (task.isDone) updTask.isDone = task.isDone;
        if (task.title) updTask.title = task.title;
        if (!updTask) {
            res.status(400);
            res.json({ "error": "Bad data" });
        } else {
            console.log(req.params.id)
            let dbCollection:Collection = DB.getCollection('product');

            dbCollection.update({ _id: new ObjectId(req.params.id) }, updTask, {}, function (err:any, tasks:Object) {
                if (err) res.send(err);
                res.json(tasks);
            });
        }
    }

    


}

export { Tasks }