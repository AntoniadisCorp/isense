import { Response } from 'express'
import useragent from 'express-useragent'
import { utype } from './datamodel'
import { isString, isArray,  } from 'util';
import { compareSync, hashSync, genSaltSync } from 'bcrypt'
class GBRoutines {

        // private version: string
        
        // constructor(version: string) {
        //     this.version = version
        // }
        // public GBRoutines(): void {}
        public generateUUID (version: string): string {

            switch (version) {
                case 'timestamp':
                    const uuidv1 = require('uuid/v1')
                    return uuidv1()
                    break
                case 'random':
                    const uuidv4 = require('uuid/v5')
                    return uuidv4()
                    break
                default:
                    const uuidv5 = require('uuid/v5')
                    // ... using predefined URL namespace (for, well, URLs) 
                    uuidv5('mail.technicalprb.com', uuidv5['URL'])
                    return uuidv5['URL']
                    break
            }
        }

        public getUserSession(res: Response, machineId: string) {

            let  source: string = res.header('user-agent').toString(),
                    us = useragent.parse(source || '')
            
                return {
                    agent: {
                        isMobile:  us? us.isMobile : '',
                        isBot: us? us.isBot : '',
                        browser: us? us.browser : '',
                        version: us? us.version : '',
                        os: us? us.os : '',
                        platform: us? us.platform : '',
                        source: source || '',
                    }, // User Agent we get from headers
                    referrer: res.header('referrer') || '', //  Likewise for referrer
                    ip: res.header('x-forwarded-for') || res.connection.remoteAddress, // Get IP - allow for proxy
                    device: { // Get screen info that we passed in url post data
                        OsUUID: machineId,
                        type: '' // res.device.type.toUpperCase()
                    }
                }
            }

            /* -------------------------- passport Strategy -------------------------- */
            // Compares hashed passwords using bCrypt
            public isValidPassword(user:utype, password:string) {
                
                return compareSync(password, user.password)
            }

            // Generates hash using bCrypt
            public createHash(password: string) {

                return hashSync(password, genSaltSync(10))
            }

            public Variablevalid(s: any) {

                return s && (isString(s) || isArray(s)) && s.length > 0 ? s : null
            }

}

export { GBRoutines }