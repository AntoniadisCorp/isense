import { FileArray, UploadedFile } from "express-fileupload"

export interface ExpressMulterFile extends FileArray {

    avatar: UploadedFile
}

export interface ImageDef {
    src: string
    storageUrl: string
    file: UploadedFile | null | {}
}
