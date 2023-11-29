
import fpath from 'path'
import { log } from '../logger/log'
export const laptop: string = 'C:/Users/kopie/Documents/VSCodeProjects'
export const desktop: string = 'C:/Users/user/Documents/Projects'

// Multer File upload STORAGE PATH
export const STORAGE_DEFAULT_DIR: string = desktop + '/smartdeep/src' || fpath.join(__dirname, '..')

export const CLIENT_DEFAULT_HOST: string = 'http://localhost:4200'



export const AVATAR_DEFAULT_DIR = '/assets/img/avatars/'

export const AVATAR_DEFAULT_LINK = CLIENT_DEFAULT_HOST + AVATAR_DEFAULT_DIR


// Multer File upload PATH
export const IMAGE_DEFAULT_DIR = STORAGE_DEFAULT_DIR + AVATAR_DEFAULT_DIR;



log(`This platform is ${process.platform}`);