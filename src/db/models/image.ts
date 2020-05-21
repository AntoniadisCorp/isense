import { FileArray, UploadedFile } from 'express-fileupload';
import { CLIENT_DEFAULT_HOST, STORAGE_DEFAULT_DIR } from '../../global';



export interface ExpressMulterFile extends FileArray {

    avatar: UploadedFile
}

export interface ImageDef {
    src: string
    storageUrl: string
    file: UploadedFile | null | {}
}


export function fileImgError(files: FileArray | undefined) {

    let err: boolean = (files !== null && !files) || (files !== null && Object.keys(files).length === 0)
    console.log(files, err)
    return err
}

export const AVATAR_DEFAULT_DIR = '/assets/img/avatars/'

export const AVATAR_DEFAULT_LINK = CLIENT_DEFAULT_HOST + AVATAR_DEFAULT_DIR


// Multer File upload PATH
export const IMAGE_DEFAULT_DIR = STORAGE_DEFAULT_DIR + AVATAR_DEFAULT_DIR;

// Use the mv() method to place the file somewhere on your server
export const storagePath = (avatarFile: UploadedFile | null, path: string): string => (!avatarFile ? '' : (path + avatarFile.name))