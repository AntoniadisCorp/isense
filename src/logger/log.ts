

const getLog = () => {


    return (...args: any) => {

        console.log(...args)
    }

}

const log = process.env.NODE_ENV == "production" ? () => { } : getLog()
export { log }