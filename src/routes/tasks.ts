import express, { Request, Response, NextFunction, Router } from 'express'
import { Emailer, GBRoutines, debug, isAuth, isJwtAuth, device, gbr, upload, ExpressMulterFile } from '../global'
import { machineId, machineIdSync } from 'node-machine-id';
import fpath from 'path'
// import { mainRouter } from './'
import { DB, jdb, MemCache } from '../db/net'
import { ICategory, Category } from '../db/models'
/* import { Mongoose, mongo } from 'mongoose'; */
import { ObjectId } from 'bson';
import { Collection } from 'mongodb';
import { IMAGE_DEFAULT_DIR } from '../global';
import { isNumber } from 'util';


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


        this.tk103 = { oldpass: '' }
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

        this.router.get('/', (req: Request, res: Response) => {
            let tasks = { tArr: ['Task page 0!'] }
            console.log(tasks.tArr)
            res.send(tasks)
        })

        this.router.get('/jobs', function (req: Request, res: Response) {
            let jobs: any = [], jkeys: any = []
            const client = new MemCache().connect(15000).cb

            client.keys('*', function (err: any, keys: any) {
                if (err) return console.log(err);

                jkeys.push(keys[1])
                console.log(keys)
            })

            let sessionID: string = `${'sess:' + req.sessionID}`
            console.log(sessionID)
            client.get(sessionID, function (error: any, value: any) {
                if (error) return res.send(error);

                let job = { key: value };
                jobs.push(job)
                console.log(value)
                res.json(jobs)
            })

        })


        // We plugin our jwt strategy as a middleware so only verified users can access this route
        this.router.get('/random', isJwtAuth, (req: Request, res: Response) => {
            res.status(200).json({ code: 200, status: 'success', data: { result: Math.floor(Math.random() * 100) } });
        })

        // CATEGORY
        this.router.get('/categories', isJwtAuth, this.getTasks); // Get All Tasks
        this.router.get('/categories/search', isJwtAuth, this.SearchTasks); // Search All Categories
        this.router.get('/category/:id', isJwtAuth, this.OneTask); // Get Single task

        // LIBRARY
        this.router.get('/library/search', isJwtAuth, this.SearchTasks) // Search for Libraries
        this.router.get('/library/book/search', isJwtAuth, this.SearchTasks) // Search for Libraries
        this.router.get('/library/:id', isJwtAuth, this.OneTask); // Get Single task
    }

    /**
     * https Router Posts
     */

    httpRoutesPosts(): void {

        // this.router.post('/emails', this.sendEmail) // send email
        // this.router.post('/subscribers', this.sub) // subscribe

        // LIBRARY
        this.router.post('/library/save', isJwtAuth, this.SaveTasks)
        this.router.post('/library/book/save', isJwtAuth, /* upload.single('avatar'),  */this.SaveTasksWithProgress)

        // CATEGORY
        this.router.post('/save', this.SaveTasks); // Save task
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

        this.router.put('/:id', this.updatetask); // Update task
        // this.router.put('/resetpass/:id', auth, this.resetpassword); // update password of the device

    }

    /**
     * Router Functions
     */

    // if the user is authenticated redirect to home
    // ---------- https Functions ToDo ----------

    async getTasks(req: Request, res: Response, next: NextFunction) {

        try {
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                let dbCollection: Collection = DB.getCollection('category');

                dbCollection.find({ recyclebin: false }).limit(100).toArray((err: any, categories: any) => {

                    if (err) res.status(500).json(err)
                    if (debug.explain) console.log(categories)
                    res.status(200).json(gbr.getNestedChildren(categories));
                })
            }
        }
        catch (error) {
            console.error(`Unable to connect to Mongo!`, error);
        }
    }

    async SearchTasks(req: Request, res: Response, next: NextFunction) {

        try {
            // find for firstname and lastname and mobile
            const queryParams = req.query;

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                const
                    filter = queryParams.q || '',
                    _id = queryParams._id || filter,
                    sortOrder = queryParams.sortOrder || '',
                    pageNumber = parseInt(queryParams.pageNumber) || 1,
                    pageSize = parseInt(queryParams.pageSize) || 10,
                    collectionName: string = queryParams.col,
                    dbCollection: Collection = DB.getCollection(collectionName);
                    
                // let s: string = _id != undefined? filter : _id;
                if (_id) _id.replace(/\D/g, '')
                    

                const regex2 = Number(_id),
                    regex = new RegExp(gbr.escapeRegex(filter), 'gi');

                console.log(`search in ${collectionName} by ${filter} or ${regex2 ? regex2 : ''}`)
                let query = 
                    (filter === '')? { recyclebin: false } : 
                    { $or: [{ 'name': { $regex: regex } }, { '_id': regex2 }], recyclebin: false }
                
                    dbCollection.find(query)
                    .sort(sortOrder && sortOrder !== '' ? { name: sortOrder && sortOrder === 'asc' ? 1 : -1 } : { _id: -1 })
                    .skip((pageSize * pageNumber) - pageSize)
                    .limit(pageSize)
                    .toArray(
                        (err: any, result: any[]) => {
                            // callback
                            if (err) {
                                console.error(err)
                                return next(err);
                            }
                            if (debug.explain) console.log(result)

                            
                            dbCollection.count(query).then( (count:number) => {

                                res.status(200).json({
                                    code: 200,
                                    status: 'success',
                                    data: {
                                        result,
                                        current: pageNumber,
                                        pages: Math.ceil(count / pageSize),
                                        count,
                                        message: ``
                                    }
                                })
                            }).catch( err => {
                                res.status(505).json({ code: 505, status: 'error', error: err })
                            })
                            
                        }
                    )
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({ code: 500, status: 'error', error: error })
        }

    }

    async SaveTasksWithProgress(req: Request, res: Response, next: NextFunction) {

        try {

            const jsonObj = req.body

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {
                const url = req.protocol + '://' + req.get('host')
                
                if (req.files === null) {
                } else if (!req.files || Object.keys(req.files).length === 0) {
                    return res.status(505).json({
                        code: 505,
                        status: 'error',
                        error: 'No files were uploaded.'
                    })
                }

                let files: ExpressMulterFile = <ExpressMulterFile><unknown>req.files

                // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                const avatarFile = files? files.avatar : null

                console.log(avatarFile, jsonObj)


                // Use the mv() method to place the file somewhere on your server
                const path: string = avatarFile? IMAGE_DEFAULT_DIR + avatarFile.name : ''

                if (avatarFile) {
                    avatarFile.mv(path, (err: any) => {
                        if (err) res.status(505).json({ code: 505, status: 'error', error: err })
                    });
                }
                

                let dbCollection: Collection = DB.getCollection(jsonObj.col);

                const books = {
                    _id: Number(jsonObj._id),
                    name: jsonObj.title,
                    bookcase: jsonObj.bookcase,
                    author: jsonObj.author,
                    publisher: jsonObj.publisher,
                    year: jsonObj.year,
                    pages: jsonObj.pages,
                    categoryId: jsonObj.categoryId,
                    libraryId: jsonObj.libraryId,
                    dimensions: {
                        x: jsonObj.x,
                        y: jsonObj.y,
                    },
                    isbn10: jsonObj.isbn10,
                    isbn13: jsonObj.isbn13,
                    status: jsonObj.status,
                    notes: jsonObj.status.notes,
                    avatar: {
                        src: !avatarFile? '' : 'http://localhost:4200' + '/assets/img/avatars/' + avatarFile.name,
                        storageUrl: path && path.length>0? path : '',
                        file: avatarFile? avatarFile : {},
                    },
                    recyclebin: false
                }
                dbCollection.save(books, (err: any, result: any) => {
                    if (err) { res.status(500).json({ code: 500, status: 'error', error: err }); }

                    res.status(200).json({
                        code: 200,
                        status: 'success',
                        data: {
                            result,
                            message: `File uploaded to ${path} successful! `
                        }
                    })
                })
            }
        } catch (error) {
            console.error(error)
            res.status(500).json({ code: 500, status: 'error', error: error })
        }

        // Delay the execution of findOrSignup and execute 
        // the method in the next tick of the event loop

        // process.nextTick();
    }

    async SaveTasks(req: Request, res: Response, next: NextFunction) {

        try {
            // find for firstname and lastname and mobile
            const jsonObj = req.body

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                let dbCollection: Collection = DB.getCollection(jsonObj.col);

                dbCollection.save(jsonObj.data, (err: any, result) => {
                    if (err) { res.status(500).json({ code: 500, status: 'error', error: err }); }
                    res.status(200).json({ code: 200, status: 'success', data: { result } });
                });
            }
        } catch (error) {
            res.status(500).json({ code: 500, status: 'error', error: error })
        }

        // Delay the execution of findOrSignup and execute 
        // the method in the next tick of the event loop

        // process.nextTick();
    }

    async OneTask(req: Request, res: Response, next: NextFunction) {


        try {
            // find for firstname and lastname and mobile
            const queryParams = req.query

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                console.log(queryParams)

                const dbCollection: Collection = DB.getCollection(String(queryParams.col));

                dbCollection.findOne({ _id: ObjectId.isValid(req.params.id)? new ObjectId(req.params.id) :
                     Number(req.params.id), recyclebin: false }, (err: any, result: any) => {

                    if (err) { res.status(505).json({ code: 505, status: 'error', error: err }); }
                    res.status(200).json({ code: 200, status: 'success', data: { result } });
                });
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({ code: 500, status: 'error', error: error })
        }

        // Delay the execution of findOrSignup and execute 
        // the method in the next tick of the event loop

        // process.nextTick();


    }

    async savetask(req: Request, res: Response, next: NextFunction) {

        let jsonObj = req.body.data,

            newobj = {
                _id: new ObjectId().toHexString(),
                name: jsonObj.name,
                desc: jsonObj.desc,
                icon: jsonObj.icon,
                parent_id: jsonObj.parent_id,
                status: true,
                top: jsonObj.parent_id && jsonObj.parent_id.length > 0 ? false : true,
                date_added: new Date()
            },
            dbCollection: Collection = DB.getCollection('category');

        dbCollection.save(newobj, (err: any) => {
            if (err) {
                res.status(500).json({ error: err });
            }
            res.status(200).json({ code: 200, status: "success" });
        });

    }

    async deletetask(req: Request, res: Response, next: NextFunction) {

        let sterm = req.body,
            arr: string[] = sterm.q ? sterm.q : [];

        if (arr.length > 0) {
            console.log(arr)

            let dbCollection: Collection = DB.getCollection('Category')

            dbCollection.updateMany(
                { '_id': { '$in': arr } },
                { $set: { recyclebin: true } },
                (err: any) => {
                    if (err) {
                        res.status(500).json({ error: err });
                    }
                    res.status(200).json({ code: 200, status: "success" });
                }
            )

        } else { res.status(500).json({ code: 500, status: "failed" }); }
    }

    async updatetask(req: Request, res: Response, next: NextFunction) {

        var task = req.body,
            updTask = { isDone: true, title: '' };
        // const mycollection = client.db(dbname).collection('product')

        if (task.isDone) updTask.isDone = task.isDone;
        if (task.title) updTask.title = task.title;
        if (!updTask) {
            res.status(400);
            res.json({ "error": "Bad data" });
        } else {
            console.log(req.params.id)
            let dbCollection: Collection = DB.getCollection('product');

            dbCollection.update({ _id: new ObjectId(req.params.id) }, updTask, {}, function (err: any, tasks: Object) {
                if (err) res.send(err);
                res.json(tasks);
            });
        }
    }




}

export { Tasks }