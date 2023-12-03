export interface OptionEntry {

    headers?: {
        'Content-Type': string | undefined
        'Last-Modified'?: string | undefined
        'Referer'?: string | undefined
        'User-Agent'?: string | undefined
    },
    code: number
    status: string
    data?: entryData | any
    view?: string
    error?: any
}

export interface entryData {

    result?: Array<any>
    message?: string
    error?: undefined
    current?: number
    pages?: number
    count?: number
}