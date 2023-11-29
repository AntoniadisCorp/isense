import { env } from "process"

const getLog = () => {


    return (...args: any) => {

        console.log(...args)
    }

}

const log = env.NODE_ENV === "production" ? () => { } : getLog()
export { log }