let generatePassword = require("password-generator"),
    maxLength = 18,
    minLength = 6,
    uppercaseMinCount = 3,
    lowercaseMinCount = 3,
    numberMinCount = 2,
    specialMinCount = 2,
    UPPERCASE_RE = /([A-Z])/g,
    LOWERCASE_RE = /([a-z])/g,
    NUMBER_RE = /([\d])/g,
    SPECIAL_CHAR_RE = /([\?\-])/g,
    NON_REPEATING_CHAR_RE = /([\w\d\?\-])\1{2,}/g

export interface utype {

    _id: number | undefined
    Firstname?: string | undefined
    Lastname?: string | undefined
    email: string | undefined
    mobile?: number | undefined
    username: string | undefined
    password: string
    carmark?: string | undefined
    carsecurity?: string | undefined
    carmodelname?: string | undefined
    carnumber?: string | undefined
    day?: string | undefined
    month?: string | undefined
    year?: string | undefined
    registeredOn?: number | undefined
}


export class User implements utype {

    _id: number | undefined
    Firstname: string | undefined
    Lastname: string | undefined
    email: string | undefined
    mobile: number | undefined
    carnumber: string | undefined
    username: string | undefined
    password: string
    carmark: string | undefined
    carsecurity: string | undefined
    carmodelname: string | undefined
    day: string | undefined
    month: string | undefined
    year: string | undefined
    registeredOn: number | undefined

    constructor() {

        this.password = this.customPassword()
        /* this._id = undefined
        this.Firstname = undefined
        this.Lastname = undefined
        this.email = undefined
        this.mobile = 0
        this.username = undefined
        this.carmark = undefined
        this.carsecurity = undefined
        this.carmodelname = undefined
        this.day = undefined
        this.month = undefined
        this.year = undefined */
        this.registeredOn = Date.now()

    }

    set(usertype: utype): object {

        return {

            _id: this._id = usertype._id,
            email: this.email = usertype.email ? usertype.email : undefined,
            Firstname: this.Firstname = usertype.Firstname,
            Lastname: this.Lastname = usertype.Lastname,
            mobile: this.mobile = usertype.mobile ? usertype.mobile : undefined,
            username: this.username = usertype.mobile ? usertype.mobile.toString() : usertype.email,
            password: this.password = usertype.password ? usertype.password : this.customPassword(),
            carmark: this.carmark = usertype.carmark,
            carsecurity: this.carsecurity = usertype.carsecurity,
            carnumber: this.carnumber = usertype.carnumber,
            carmodelname: this.carmodelname = usertype.carmodelname,
            day: this.day = usertype.day,
            month: this.month = usertype.month,
            year: this.year = usertype.year,
            timeregister: this.registeredOn = usertype.registeredOn
        }
    }

    private isStrongEnough(password: string) {

        var uc = password.match(UPPERCASE_RE)
        var lc = password.match(LOWERCASE_RE)
        var n = password.match(NUMBER_RE)
        var sc = password.match(SPECIAL_CHAR_RE)
        var nr = password.match(NON_REPEATING_CHAR_RE)
        return password.length >= minLength &&
            !nr &&
            uc && uc.length >= uppercaseMinCount &&
            lc && lc.length >= lowercaseMinCount &&
            n && n.length >= numberMinCount &&
            sc && sc.length >= specialMinCount
    }

    private customPassword() {
        var password = ''
        var randomLength = Math.floor(Math.random() * (maxLength - minLength)) + minLength
        while (!this.isStrongEnough(password)) {
            password = generatePassword(randomLength, false, /[\w\d\?\-]/)
        }
        return password
    }
}

export interface OptionEntry {

    code: number;
    status: string;
    data?: entryData | any;
    error?: any;
}

export interface entryData {

    result?: Array<any>
    message?: string
}