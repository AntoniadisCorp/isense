import { Response } from 'express'
import * as useragent from 'express-useragent'
import { isString, isArray } from 'util';
import { v1 as uuidv1, v4 as uuidv4, v5 as uuidv5, v5 as uuidv5_, } from 'uuid';
import { compareSync, genSaltSync, hashSync } from 'bcrypt'
import { utype } from '../interfaces';


const debug = { explain: false }
class GBRoutines {

    // private version: string

    // constructor(version: string) {
    //     this.version = version
    // }
    // public GBRoutines(): void {}


    public generateUUID(version: string): string {

        switch (version) {
            case 'timestamp':
                // const { v1: uuidv1 } = require('uuid');
                return uuidv1()
                break
            case 'random':
                // const { v5_: uuidv5_ } = require('uuid');
                const v4options = {
                    random: [
                        0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea, 0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36,
                    ],
                };
                return uuidv4(v4options)
                break
            case 'UUID':
                // const { v4: uuidv4 } = require('uuid');
                return uuidv4()
                break
            default:
                // const { v5: uuidv5 } = require('uuid');
                // ... using predefined URL namespace (for, well, URLs) 
                uuidv5('mail.technicalprb.com', uuidv5['URL'])
                return uuidv5['URL']
                break
        }
    }

    public getUserSession(res: Response, machineId: string) {

        let source: string = res.header('user-agent').toString(),
            us = useragent.parse(source || '')

        return {
            agent: {
                isMobile: us ? us.isMobile : '',
                isBot: us ? us.isBot : '',
                browser: us ? us.browser : '',
                version: us ? us.version : '',
                os: us ? us.os : '',
                platform: us ? us.platform : '',
                source: source || '',
            }, // User Agent we get from headers
            referrer: res.header('referrer') || '', //  Likewise for referrer
            ip: res.header('x-forwarded-for') || res.socket!.remoteAddress, // Get IP - allow for proxy
            device: { // Get screen info that we passed in url post data
                OsUUID: machineId,
                type: '' // res.device.type.toUpperCase()
            }
        }
    }

    /* -------------------------- passport Strategy -------------------------- */
    // Compares hashed passwords using bCrypt
    //We'll use this later on to make sure that the user trying to log in has the correct credentials
    public isValidPassword(user: utype, password: string): boolean {

        //Hashes the password sent by the user for login and checks if the hashed password stored in the 
        //database matches the one sent. Returns true if it does else false.
        return compareSync(password, user.password)
    }

    // Generates hash using bCrypt
    public createHash(password: string) {
        return hashSync(password, genSaltSync(10));
    }

    public Variablevalid(s: any) {

        return s && (isString(s) || isArray(s)) && s.length > 0 ? s : null
    }


    public getNestedChildren = (arr: Array<any>, parent?: string) => {
        let out: Array<any> = []
        let str: string;

        for (let i in arr) {
            str = arr[i] && arr[i].parentId ? arr[i].parentId : undefined

            /* console.log( 'parentId: ' + str  + `  ` + parent) */
            if (!str && str == parent || str && str.toString() == parent) {

                let children = this.getNestedChildren(arr, arr[i]._id)

                if (children.length > 0) arr[i].children = children

                out.push(arr[i])
            }
        }
        return out
    }


    public toNestedChildren(categories: any) {

        var idToNodeMap: any = {};
        var root: any = {};
        var bigRoot: any = []

        //loop over data
        categories.forEach((datum: any) => {
            //each node will have children, so let's give it a "children" poperty
            datum.children = [];

            console.log(datum)
            //add an entry for this node to the map so that any future children can
            //lookup the parent
            idToNodeMap[datum._id] = datum;

            //Does this node have a parent?
            if (typeof datum.parentId === 'undefined' || datum.parentId === null) {
                //Doesn't look like it, so this node is the root of the tree
                root = datum
                bigRoot.push(root)
            } else {
                //This node has a parent, so let's look it up using the id
                const parentNode = idToNodeMap[datum.parentId];

                //Let's add the current node as a child of the parent node.
                if (parentNode)
                    parentNode.children.push(datum);
            }
        });
        /*  for (var i = 0; i < categories.length; i++) {
             category = categories[i];
             //  category.children = [];
             idToNodeMap[category._id] = category;
 
             if (typeof category.parentId === 'undefined' || category.parentId === null) {
                 root.push(category);
             } else {
                 idToNodeMap[category.parentId].children = [];
                 idToNodeMap[category.parentId].children.push(category);
             }
         } */

        console.log(bigRoot/* , idToNodeMap */);
        return bigRoot
    }

    public escapeRegex(text: string) {

        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    public memorySizeOf(obj: any) {
        var bytes = 0;

        function sizeOf(obj: any) {
            if (obj !== null && obj !== undefined) {
                switch (typeof obj) {
                    case 'number':
                        bytes += 8;
                        break;
                    case 'string':
                        bytes += obj.length * 2;
                        break;
                    case 'boolean':
                        bytes += 4;
                        break;
                    case 'object':
                        var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                        if (objClass === 'Object' || objClass === 'Array') {
                            for (var key in obj) {
                                if (!obj.hasOwnProperty(key)) continue;
                                sizeOf(obj[key]);
                            }
                        } else bytes += obj.toString().length * 2;
                        break;
                }
            }
            return bytes;
        };

        function formatByteSize(bytes: number) {
            if (bytes < 1024) return bytes + " bytes";
            else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB";
            else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB";
            else return (bytes / 1073741824).toFixed(3) + " GiB";
        };

        return formatByteSize(sizeOf(obj));
    };
}

export default new GBRoutines()
export { debug }