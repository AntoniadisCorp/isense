import { Request, Response, NextFunction, Router } from 'express'

import * as express from 'express'
import { Emailer, GBRoutines, debug, isAuth, isJwtAuth, gbr, upload, createBookCase, shiftRByKey, shiftRsortNo, shiftLsortNo, shiftLByKey, OptionEntry, STORAGE_DEFAULT_DIR, missNoArray, getMinMax } from '../global'
import { machineId, machineIdSync } from 'node-machine-id';

// import { mainRouter } from './'
import { DB, jdb, MemCache } from '../db/net'
import { ICategory, Category, addHierarchyCategory, rebuildHierarchyCategory, reconstructDescendants, updateAncestryCategory, setBook, Book, saveBookInDb, updateBookinDB, getBookFromDb } from '../db/models'
/* import { Mongoose, mongo } from 'mongoose'; */
import { ObjectId } from 'bson';
import { Collection, WriteOpResult, InsertOneWriteOpResult, UpdateWriteOpResult, FindAndModifyWriteOpResultObject, FilterQuery, CursorResult, Cursor } from 'mongodb';

import { fileImgError, ExpressMulterFile, storagePath, AVATAR_DEFAULT_DIR } from '../db/models/image';
import { UploadedFile } from 'express-fileupload';

var arrayToTree = require('array-to-tree');


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
        // this.router.use(device.capture())
        this.httpRoutesGets()
        this.httpRoutesPosts()
        this.httpRoutesPut()
        this.httpRoutesDelete()
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

        const random = (req: Request, res: Response) => {
            res.status(200).json({ code: 200, status: 'success', data: { result: Math.floor(Math.random() * 100) } });
        }

        // We plugin our jwt strategy as a middleware so only verified users can access this route
        this.router.get('/random', isJwtAuth, random)

        // LIBRARY
        this.router.get('/library/search', isJwtAuth, this.SearchByfilter) // Search for Libraries
        this.router.get('/library/search/:id', isJwtAuth, this.getBookById); // Get Single task
        this.router.get('/library/book/search', isJwtAuth, this.SearchTasks) // Search for Libraries
        this.router.get('/library/book/sku', isJwtAuth, this.getSKU)
        this.router.get('/library/space/search', isJwtAuth, this.SearchTasks) // Search for Libraries Space

        // CATEGORY
        this.router.get('/library/categories/:id', isJwtAuth, this.getTasks)

        this.router.get('/categories', isJwtAuth, this.getTasks); // Get All Tasks
        this.router.get('/categories/search', isJwtAuth, this.SearchByfilter); // Search All Categories
        this.router.get('/categories/book', isJwtAuth, this.SearchTasks) // Search for Libraries
        this.router.get('/category/:id', isJwtAuth, this.getTask); // Get Single task

        // USER
        this.router.get('/user/library/:id/cache/:hash', isJwtAuth, this.userCache, this.OneTask)
    }



    // When you generate a new JWT token, as the request is going to continue to next middleware step, probably you will need to set the user, same as you do when the jwt is correct. Something like this, try it, and let me know if it helps:

    /* if (user.refreshToken === req.signedCookies.refreshToken) {
      req.session.jwt = user.generateToken();
      const decoded = jwt.verify(req.session.jwt, config.get("jwtPrivateKey"));
      req.user = decoded;
      next();
    } */


    /**
     * https Router Posts
     */

    httpRoutesPosts(): void {

        // this.router.post('/emails', this.sendEmail) // send email
        // this.router.post('/subscribers', this.sub) // subscribe

        // GENERAL LIBRARY posts / gets
        this.router.post('/library/get/ids', isJwtAuth, this.getTaskByIds) // Get Categories by Id

        // LIBRARY SAVE
        this.router.post('/library/save', isJwtAuth, this.SaveTasks)
        this.router.post('/library/book/save', isJwtAuth, /* upload.single('avatar'),  */this.SaveBookWithProgress)
        this.router.post('/library/space/save', isJwtAuth, /* upload.single('avatar'),  */this.SaveTasks)

        // LIBRARY UPDATE
        this.router.post('/library/book/update', isJwtAuth, /* upload.single('avatar'),  */this.updateBookWithProgress)

        // CATEGORY
        this.router.post('/library/category/save', isJwtAuth, this.saveCategory); // Save task
        this.router.post('/library/category/update', isJwtAuth, this.editCategory) // Update/Edit Categories
        this.router.post('/library/category/del', isJwtAuth, this.deleteTasks); // Update/Delete Tasks

        // BOOKCASE
        this.router.post('/library/alloc/save', isJwtAuth, /* upload.single('avatar'),  */this.saveLibDistribute, this.SaveTasks)
        // this.router.post('/library/alloc/update', isJwtAuth, this.saveLibDistribute, this.SaveTasks)
        this.router.post('/library/alloc/del/:col/:id', isJwtAuth, this.delLibDistribute, this.deleteOneTask)

        // OLD
        this.router.post('/category/save', isJwtAuth, this.SaveTasks); // Save task
        this.router.post('/category/del', isJwtAuth, this.deleteTasks); // Update/Delete Tasks
    }

    /**
     * https Router Delete
     */

    httpRoutesDelete(): void {

        // GENERAL TASK ROUTES
        this.router.delete('/del/:col/:id', isJwtAuth, this.deleteOneTask) // Delete task
    }

    /**
     * https Router Put - update
     */

    httpRoutesPut(): void {

        this.router.put('/:id', this.updateTask); // Update task
        // this.router.put('/resetpass/:id', auth, this.resetpassword); // update password of the device
    }

    /**
     * Router Functions
     */

    // FUNCTION REDIS CACHE

    async userCache(req: Request, res: Response, next: NextFunction) {

        const params = req.params


        // store user key to redis
        const Redisclient = new MemCache().connect(15000).cb
        Redisclient.hmget(params.hash, `${params.id}`, (err: any, redisres: any) => {

            if (err || !redisres) {

                if (debug.explain) console.error(err);
                Redisclient.quit()
                req.query.exceptFields = JSON.stringify({ password: 0 })
                return next()
            }

            const result: any = JSON.parse(redisres)

            Redisclient.quit()

            if (debug.explain) console.log('redisUser', result)
            res.status(200).json({
                code: 200,
                status: 'success',
                data: {
                    result,
                    // current: pageNumber,
                    // pages: Math.ceil(count / pageSize),
                    // count,
                    message: ``
                }
            })
        })
    }

    async getSKU(req: Request, res: Response) {

        // Check DB Connection
        if (!DB.isConnected()) { // trying to reconnect
            await DB.connect()
                .catch((error: any) => {
                    console.error(error)
                    return res.status(503).json({ code: 503, status: 'DBConnectionError', error: error })
                })
        }

        const dbCollection: Collection = DB.getCollection('book')

        let k = await dbCollection.find({}, { fields: { SKU: 1 } }).min({ SKU: 0 }).max({ SKU: 1000 }).hint({ SKU: 1 }).limit(100).toArray()


        if (k) {
            let SKU: number[] = k.map(v => v.SKU)
            let no = getMinMax(missNoArray(SKU))

            console.log('SKU: ', SKU)

            return res.status(200).json({
                code: 200, status: 'success', data: {
                    result: no.min ? no.min : getMinMax(SKU).max >= 0 ? getMinMax(SKU).max + 1 : 0 /* arrayToTree(categories, {
                        parentProperty: 'parentId',
                        customID: '_id'
                    }) */
                }
            });
        }

    }

    // if the user is authenticated redirect to home
    // ---------- https Functions ToDo ----------

    async getTasks(req: Request, res: Response, next: NextFunction) {

        try {
            const queryParams = req.query;

            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                const _id = req.params.id || undefined,
                    collectionName: string = queryParams.col || 'category',

                    dbCollection: Collection = DB.getCollection(collectionName);

                // console.log(`id: ++++++++++++++++++++++++++ ${queryParams.col}`, _id)

                let query: any = {
                    // root: true,
                    recyclebin: false
                }

                if (_id) query._id = new ObjectId(_id)


                dbCollection.find(query).limit(100).toArray((err: any, categories: any) => {

                    if (err) { res.status(500).json({ code: 500, status: 'DbError', error: err }); }
                    const k = gbr.getNestedChildren(categories)
                    if (debug.explain) console.log(k)
                    res.status(200).json({
                        code: 200, status: 'success', data: {
                            result: k/* arrayToTree(categories, {
                                parentProperty: 'parentId',
                                customID: '_id'
                            }) */
                        }
                    });
                })
            }
        }
        catch (error) {
            res.status(500).json({ code: 500, status: 'tryCatchError', error: error })
        }
    }

    async getTask(req: Request, res: Response, next: NextFunction) {



        try {

            // find for firstname and lastname and mobile
            const queryParams = req.query;
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {


                const
                    filter = queryParams.filter || '',
                    _id = new ObjectId(req.params.id) || filter,
                    collectionName: string = queryParams.col,
                    dbCollection: Collection = DB.getCollection(collectionName);

                let query = {
                    _id,
                    recyclebin: false
                    /* $or: [, { $text: { $search: regex.source }, },
                        { 'categoryId': _id }] */
                }

                dbCollection.findOne(query, (err: any, result: any) => {
                    // callback
                    if (err) {
                        if (debug.explain) console.error(err)
                        return next(err);
                    }
                    if (debug.explain) console.log(result)
                    res.status(200).json({
                        code: 200,
                        status: 'success',
                        data: {
                            result,
                            // current: pageNumber,
                            // pages: Math.ceil(count / pageSize),
                            // count,
                            message: ``
                        }
                    })
                })
            }
        }
        catch (error) {
            console.log(error)
            res.status(500).json({ code: 500, status: 'error', error: error })
        }
    }

    async getTaskByIds(req: Request, res: Response) {

        try {

            // find for firstname and lastname and mobile
            const queryBody = req.body;
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {


                const
                    _id: ObjectId[] = (queryBody.data.ids as string[]).map(v => new ObjectId(v)),
                    // filter = queryParams.filter || '',
                    collectionName: string = queryBody.col,
                    dbCollection: Collection = DB.getCollection(collectionName),
                    query = { '_id': { "$in": _id }, recyclebin: false }





                dbCollection.find(query)
                    .toArray(
                        (err: any, result: any[]) => {
                            // callback
                            if (err) {
                                if (debug.explain) console.error(err)
                                res.status(500).json({ code: 500, status: 'DbError', error: err });


                            }
                            else res.status(200).json({
                                code: 200,
                                status: 'success',
                                data: {
                                    result,
                                    // current: pageNumber,
                                    // pages: Math.ceil(count / pageSize),
                                    // count,
                                    message: ``
                                }
                            })


                        })
            }
        }
        catch (error) {
            console.log(error)
            res.status(500).json({ code: 500, status: 'error', error: error })
        }


    }

    async SearchByfilter(req: Request, res: Response, next: NextFunction) {

        try {
            // find for firstname and lastname and mobile
            const queryParams = req.query;

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                const
                    filter = queryParams.filter || '',
                    SKU = filter,
                    collectionName: string = queryParams.col,
                    dbCollection: Collection = DB.getCollection(collectionName);

                if (SKU) SKU.replace(/\D/g, '')

                const regex2 = Number(SKU),
                    regex = new RegExp(gbr.escapeRegex(filter), 'gi')

                let query =
                    (filter === '') ? { recyclebin: false } : {
                        $or: [/* { $text: { $search: regex.source }, }, */
                            { 'name': { $regex: regex } }, { 'SKU': regex2 }, { 'whatnot': { $regex: regex } }], recyclebin: false
                    }

                dbCollection.find(query)
                    .toArray(
                        (err: any, result: any[]) => {
                            // callback
                            if (err) {
                                console.error(err)
                                return next(err);
                            }
                            console.log(result)


                            res.status(200).json({
                                code: 200,
                                status: 'success',
                                data: {
                                    result,
                                    // current: pageNumber,
                                    // pages: Math.ceil(count / pageSize),
                                    // count,
                                    message: ``
                                }
                            })
                        })

            }

        } catch (error) {
            console.log(error)
            res.status(500).json({ code: 500, status: 'error', error: error })
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
                console.log(queryParams.refField)

                const refField: string = queryParams.refField ? JSON.parse(queryParams.refField) : '' || ''
                const extrafilters: any = refField.length > 0 ? refField : [{}]

                const
                    filter = queryParams.filter || '',
                    _id = queryParams._id || null,
                    SKU = queryParams.SKU || filter,
                    sortActive = queryParams.sortActive || '',
                    sortOrder = queryParams.sortOrder || '',
                    pageNumber = parseInt(queryParams.pageNumber) || 1,
                    pageSize = parseInt(queryParams.pageSize) || 10,
                    collectionName: string = queryParams.col,
                    dbCollection: Collection = DB.getCollection(collectionName);

                console.log(`Start search in ${collectionName} by ${filter}`)

                if (SKU) SKU.replace(/\D/g, '')

                const sortDirection = sortOrder && sortOrder === 'asc' ? 1 : -1
                let objSort: { [x: string]: any } = {}

                if (sortActive && sortActive !== '')
                    objSort[sortActive] = sortDirection

                const sort = sortOrder && sortOrder !== '' ? objSort : { _id: -1 }

                const regex2 = Number(SKU),
                    regex = new RegExp(gbr.escapeRegex(filter), 'gi')


                console.log(`search in ${collectionName} by ${filter} or ${regex2 ? regex2 : ''}, ${regex.source}`, queryParams.refField)

                if (extrafilters.length && extrafilters[0].categoryId)
                    extrafilters[0].categoryId = new ObjectId(extrafilters[0].categoryId as string)

                let query: FilterQuery<any> =
                    (filter === '') ? {
                        $and: extrafilters,
                        recyclebin: false
                    } : {
                            $or: [
                                /* { $text: { $search: regex.source }, }, */
                                { 'name': { $regex: regex } },
                                { 'SKU': regex2 },
                                { 'skuid': { $regex: regex } },
                                { 'whatnot': { $regex: regex } },
                                { 'bookshelf': { $regex: regex } },
                            ],
                            $and: extrafilters,
                            recyclebin: false
                        }
                if (_id) {
                    query._id = new ObjectId(_id)
                }


                let tblCollection: any[] = await dbCollection.find(query)
                    .sort(sort)
                    .skip((pageSize * pageNumber) - pageSize)
                    .limit(pageSize)
                    .toArray()
                // .catch((err:any) => { res.status(505).json({ code: 505, status: 'error', error: err }); })


                if (!tblCollection)
                    return res.status(505).json({ code: 505, status: 'DBerror', error: 'cannot retrieve data of the table..' });

                if (collectionName === 'book') {

                    let myArray: any[] = tblCollection.map<any>(v => new ObjectId(v._id))

                    // console.log(tblCollection.map<ObjectId>(v => new ObjectId(v._id)))
                    let k: Cursor<any> = await DB.getCollection('bookcase')
                        .find({
                            'books.arrIndex._id': { $in: tblCollection.map<ObjectId>(v => new ObjectId(v._id)) },
                        }, {
                            fields: { 'books.arrIndex': 1 }
                        })

                    k.forEach((item: any) => {

                        let myarray2: any[] = item.books.arrIndex
                        myArray.forEach((element, i) => {
                            const index = myarray2.findIndex(v => element.equals(v._id))
                            if (index > -1) tblCollection[i].bookcase.bookshelfNo = myarray2[index].bookshelfNo
                        })

                        // console.log(item, item.books.arrIndex)
                    })
                }


                dbCollection.countDocuments(query)
                    .then((count: number) => {

                        res.status(200).json({
                            code: 200,
                            status: 'success',
                            data: {
                                result: tblCollection,
                                current: pageNumber,
                                pages: Math.ceil(count / pageSize),
                                count,
                                message: ``
                            }
                        })
                    }).catch(err => {
                        return res.status(505).json({ code: 505, status: 'error', error: err })
                    })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({ code: 500, status: 'error', error: error })
        }

    }

    async updateBookWithProgress(req: Request, res: Response, next: NextFunction) {

        // Check DB Connection
        if (!DB.isConnected()) { // trying to reconnect
            await DB.connect()
                .catch((error: any) => {
                    console.error(error)
                    return res.status(503).json({ code: 503, status: 'DBConnectionError', error: error })
                })
        }

        const formData = req.body

        let saved: OptionEntry = await updateBookinDB(req.files, formData)

        if (saved) return res.status(saved.code).json(saved)
    }

    async SaveBookWithProgress(req: Request, res: Response) {

        // try {

        // Check DB Connection
        if (!DB.isConnected()) { // trying to reconnect
            await DB.connect()
                .catch((error: any) => {
                    console.error(error)
                    return res.status(503).json({ code: 503, status: 'DBConnectionError', error: error })
                })
        }

        const jsonObj = req.body

        /* const url = req.protocol + '://' + req.get('host')

        console.log(`url: ${url}`/* , req.files ) */

        let saved: OptionEntry = await saveBookInDb(req.files, jsonObj)
        // .catch((err: any) => ({ code: 500, status: 'DbError', error: err }))

        // console.log(saved)
        if (saved) return res.status(saved.code).json(saved)

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

                // if Contain _id call update method
                let ks: any[] = [];
                if (jsonObj.uniqueId) ks = await dbCollection.find({ $and: jsonObj.uniqueId, recyclebin: true }).limit(1).map(v => v._id).toArray(); // leaving this out gets you all the fields;
                if (jsonObj.data._id || !jsonObj.data._id && ks.length) jsonObj.data._id = new ObjectId(!jsonObj.data._id ? ks.pop() : jsonObj.data._id)


                console.log('Data Obj ->>> ', jsonObj.data)

                dbCollection.save(jsonObj.data, (err: any, result) => {

                    console.log(err)
                    if (err) { res.status(500).json({ code: 500, status: 'DbError', error: err }); }

                    else res.status(200).json({ code: 200, status: 'success', data: { result } });
                });
            }
        } catch (error) {
            res.status(500).json({ code: 500, status: 'tryCatchError', error: error })
        }

        // Delay the execution of findOrSignup and execute 
        // the method in the next tick of the event loop

        // process.nextTick();
    }

    async getBookById(req: Request, res: Response, next: NextFunction) {

        // Check DB Connection
        if (!DB.isConnected()) { // trying to reconnect
            await DB.connect()
                .catch((error: any) => {
                    console.error(error)
                    return res.status(503).json({ code: 503, status: 'DBConnectionError', error: error })
                })
        }

        const queryParams = req.query

        const _id = ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : Number(req.params.id)

        const exceptFields = queryParams.exceptFields ? JSON.parse(queryParams.exceptFields) : {}

        let saved: OptionEntry = await getBookFromDb(_id, String(queryParams.col), exceptFields)

        if (saved) return res.status(saved.code).json(saved)
    }


    async OneTask(req: Request, res: Response, next: NextFunction) {


        try {
            // find for firstname and lastname and mobile
            const queryParams = req.query

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                console.log('Test ' + req.params.id, queryParams)

                const dbCollection: Collection = DB.getCollection(String(queryParams.col));

                const exceptFields = queryParams.exceptFields ? JSON.parse(queryParams.exceptFields) : {}

                const filter: any = {
                    _id: ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : Number(req.params.id),
                    recyclebin: false
                }

                console.log(filter)

                dbCollection.findOne(filter, exceptFields, (err: any, result: any) => {

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

    async updateTask(req: Request, res: Response, next: NextFunction) {

        var task = req.body


        let updTask: { isDone?: boolean, title?: string } = {}


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

    async deleteOneTask(req: Request, res: Response, next: NextFunction) {


        try {
            // find for firstname and lastname and mobile
            const Params = req.params

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                console.log('Test', Params)
                const dbCollection: Collection = DB.getCollection(String(Params.col));

                dbCollection.updateOne({
                    _id: ObjectId.isValid(Params.id) ? new ObjectId(Params.id) :
                        Number(Params.id), recyclebin: false
                }, { $set: { recyclebin: true } }, { w: "majority", wtimeout: 100/* , upsert: true  */ }, (err: any, result: any) => {

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

    async deleteTasks(req: Request, res: Response, next: NextFunction) {

        let sterm = req.body,
            arr: string[] = sterm.q ? sterm.q : [];

        if (arr.length > 0) {
            console.log(arr)

            let dbCollection: Collection = DB.getCollection(sterm.col)

            dbCollection.updateMany(
                { '_id': { '$in': arr.map((v: string) => new ObjectId(v)) } },
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

    async saveCategory(req: Request, res: Response, next: NextFunction) {

        try {
            // find for firstname and lastname and mobile
            const jsonObj = req.body.data

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                let newobj: any = {},

                    dbCollection: Collection = DB.getCollection('category');

                newobj = jsonObj as ICategory
                newobj.tree = []
                newobj.date_added = new Date(jsonObj.date_added)
                if (newobj.parentId) newobj.parentId = new ObjectId(jsonObj.parentId)

                dbCollection.insertOne(newobj, (err: any, newId: any) => {
                    if (err) { res.status(505).json({ code: 505, status: 'DbError', error: err }); }

                    if (jsonObj.parentId)
                        addHierarchyCategory(new ObjectId(newId.insertedId), newobj.parentId)

                    res.status(200).json({ code: 200, status: 'success' });
                });
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({ code: 500, status: 'tryCatchError', error: error })
        }

    }

    async editCategory(req: Request, res: Response) {
        try {
            // find for firstname and lastname and mobile
            const updatedObj: any = req.body.data as ICategory

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                const dbCollection: Collection = DB.getCollection('category'),
                    _id: ObjectId = new ObjectId(updatedObj._id)
                const resetParent: boolean = updatedObj.parentId !== undefined

                let set: any = {
                    name: updatedObj.name,
                    slug: updatedObj.name.toLowerCase(),
                    icon: updatedObj.icon,
                    date_modified: new Date(updatedObj.date_modified),
                    root: updatedObj.root,
                    desc: updatedObj.desc,
                    disabled: updatedObj.disabled,
                }

                if (resetParent)
                    set['parentId'] = updatedObj.parentId && updatedObj.parentId.length ? new ObjectId(updatedObj.parentId) : null

                /* first reconstruct Children of Parent */

                const nodes = await dbCollection.find({ parentId: _id, recyclebin: false }, { fields: { _id: 1 } }).toArray()

                let parentToChild: any

                for (const child of nodes) {
                    if (child)
                        parentToChild = await dbCollection.findOne(
                            {
                                $and: [
                                    { _id: set['parentId'] },
                                    { 'tree._id': child._id/* { $in: nodes.map((e: { _id: ObjectId }) => e._id) }*/ }],
                                recyclebin: false
                            },
                            {
                                fields: { '_id': 1 },
                            })

                    // console.log(parentToChild)
                    // console.log(child._id, set['parentId'])


                    if ((parentToChild && parentToChild._id || String(child._id) === String(set['parentId'])) && child && child._id) {


                        // get Parent's Id of current node
                        const children = await dbCollection.findOne({ _id, recyclebin: false }, { fields: { parentId: 1 } })

                        const Rescat = await updateAncestryCategory(dbCollection, child._id, {
                            parentId: children.parentId, date_modified: new Date(),
                            root: !children.parentId
                        })

                        if (!!Rescat.result.nModified) {
                            if (children.parentId)
                                await addHierarchyCategory(child._id, children.parentId)
                            else if (children.parentId == null)
                                await dbCollection.updateOne({ '_id': child._id }, { '$set': { 'tree': [] } })

                            await reconstructDescendants(dbCollection, child._id);
                        }
                    }
                }

                const Rescat = await updateAncestryCategory(dbCollection, _id, set)

                if (!!Rescat.result.nModified) {

                    /* Rename Category if needed */
                    if (updatedObj.name.toLowerCase() !== updatedObj.slug) {

                        // Next, you need to update each descendant’s ancestors list
                        dbCollection.update({ 'tree._id': _id }, { '$set': { 'tree.$.name': updatedObj.name, 'tree.$.slug': updatedObj.name.toLowerCase() } }, { multi: true })
                    }

                    /**
                     * Change the Ancestry of a Category 
                     * Update the document to reflect the change in ancestry with the following operation
                     **/
                    if (!resetParent) {
                        res.status(200).json({ code: 200, status: 'success' })
                        return
                    }


                    if (updatedObj.parentId)
                        await addHierarchyCategory(_id, set['parentId'])
                    else if (updatedObj.parentId == null)
                        await dbCollection.updateOne({ '_id': _id }, { '$set': { 'tree': [] } })

                    await reconstructDescendants(dbCollection, _id);

                    res.status(200).json({ code: 200, status: 'success' })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({ code: 500, status: 'tryCatchError', error: error })
        }
    }

    async saveLibDistribute(req: Request, res: Response, next: NextFunction) {

        try {
            // find for firstname and lastname and mobile
            const jsonObj = req.body

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                let dbCollection: Collection = DB.getCollection('libraryspace') // jsonObj.col

                // if Contain _id call update method
                // let ks: any[] = [];
                // if (jsonObj.uniqueId) ks = await dbCollection.find({ $and: jsonObj.uniqueId, recyclebin: true }).limit(1).map(v => v._id).toArray(); // leaving this out gets you all the fields;
                // if (jsonObj.data._id || !jsonObj.data._id && ks.length) jsonObj.data._id = new ObjectId(!jsonObj.data._id ? ks.pop() : jsonObj.data._id)


                console.log('Data Obj ->>> ', jsonObj.data)

                let oldValues: WriteOpResult = { ops: [], connection: undefined, result: true }
                // remove, update old bookshelves as unused
                if (jsonObj.dataPlus) oldValues = await dbCollection.update({ whatnot: jsonObj.dataPlus.whatnot, 'bookshelves.name': jsonObj.dataPlus.bookshelf }, {
                    $set: { 'bookshelves.$.used': false }
                })

                if (oldValues.result)
                    dbCollection.update({ whatnot: jsonObj.data.whatnot, 'bookshelves.name': jsonObj.data.bookshelf }, {
                        $set: { 'bookshelves.$.used': true }
                    }, (err: any) => {

                        console.log({ code: 500, status: 'DbError', error: err })
                        // if (err) { res.status(500).json(); }
                        if (err) next(err)
                        // console.log(result)
                        next()
                        // else res.status(200).json({ code: 200, status: 'success', data: { result } });
                    });
            }
        } catch (error) {
            next({ code: 500, status: 'tryCatchError', error: error })
            // res.status(500).json()
        }

    }
    async delLibDistribute(req: Request, res: Response, next: NextFunction) {

        try {
            // find for firstname and lastname and mobile
            const jsonObj = req.body

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect()
                // DB.disconnect()
            } else {
                const dbCollection: Collection = DB.getCollection('libraryspace') // jsonObj.col

                console.error('jsonObj:', jsonObj)
                dbCollection.update({ whatnot: jsonObj.data.whatnot, 'bookshelves.name': jsonObj.data.bookshelf }, {
                    $set: { 'bookshelves.$.used': false }
                }, (err: any) => {

                    console.log({ code: 500, status: 'DbError', error: err })
                    // if (err) { res.status(500).json(); }
                    if (err) next(err)
                    // console.log(result)
                    next()
                    // else res.status(200).json({ code: 200, status: 'success', data: { result } });
                });
            }

        } catch (error) {
            next({ code: 500, status: 'tryCatchError', error: error })
            // res.status(500).json()
        }
    }
}

export { Tasks }