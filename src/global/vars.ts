
import fpath from 'path'
export const laptop: string = 'C:/Users/kopie/Documents/VSCodeProjects'
export const desktop: string = 'C:/Users/user/Documents/Projects'

// Multer File upload STORAGE PATH
export const STORAGE_DEFAULT_DIR: string = desktop + '/smartdeep/src' || fpath.join(__dirname, '..')

export const CLIENT_DEFAULT_HOST: string = 'http://localhost:4200'


console.log(`This platform is ${process.platform}`);