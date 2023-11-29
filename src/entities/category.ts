import { ObjectId, Collection } from 'mongodb';
import { DB } from '../db';
import { ICategory } from '../interfaces';
/* ///<reference path="../typings/modules/mongoose/index.d.ts" />
///<reference path="../typings/modules/mongodb/index.d.ts" /> */

export default function buildMakeCategory({ Id, md5, sanitize }: any) {

  return function makeCategory({
    _id = Id.makeId(),
    name,
    slug,
    icon,
    desc,
    date_added = Date.now(),
    date_modified = Date.now(),
    parentId,
    root = true,
    tree,
    disabled = false,
    recyclebin = false,

  }: any = {}) {
    if (!ObjectId.isValid(_id)) {
      throw new Error('Category must have a valid id.')
    }
    if (!name) {
      throw new Error('Category must have an name.')
    }
    if (name.length < 2) {
      throw new Error("Category name must be longer than 2 characters.")
    }
    if (!desc || desc.length < 1) {
      throw new Error('category must include at least one character of text.')
    }
    if (parentId && !ObjectId.isValid(parentId)) {
      throw new Error('If supplied. category must contain a valid parentId.')
    }

    let sanitizedDesc: string = sanitize(desc).trim(),
      hash: any;
    if (sanitizedDesc.length < 1) {
      throw new Error('Category contains no usable description.')
    }
    if (parentId) root = false



    return Object.freeze({
      getId: () => _id,
      getName: () => name,
      getSlug: () => slug,
      getCreatedOn: () => date_added,
      getHash: () => hash || (hash = makeHash()),

      getIcon: () => icon,
      getModifiedOn: () => date_modified,
      getParentId: () => parentId,
      getTree: () => tree,
      getDesc: () => sanitizedDesc,
      isDeleted: () => !recyclebin, // if recyclebin is false the is not deleted if true is deleted
      isEnabled: () => disabled,
      isRoot: () => root,
      markDeleted: () => {
        recyclebin = true
      },
      disabled: () => {
        disabled = true
      },
      enabled: () => {
        disabled = false
      }
    })

    function makeHash() {
      return md5(
        sanitizedDesc +
        disabled +
        root +
        (name || '') +
        (slug || '') +
        (icon || '')
      )
    }
  }


}

export async function addHierarchyCategory(_id: ObjectId, parentId: ObjectId): Promise<any> {


  try {

    // Check DB Connection
    if (!DB.isConnected()) { // trying to reconnect
      await DB.connect();
    } else {

      let dbCollection: Collection = DB.getCollection('category')

      let parent = await dbCollection.findOne({ '_id': parentId, projection: { 'name': 1, 'slug': 1, 'tree': 1 } })

      // log('parent:: ->', parent)

      const parentObj = { _id: parent!._id, name: parent!.name, slug: parent!.slug }

      if (!parent) return { code: 500, status: 'error', error: 'connect find category id' }
      let tree: { _id: ObjectId, name: string, slug: string }[] = []
      tree.push(...parent.tree, parentObj)

      dbCollection.updateOne({ '_id': _id }, { '$set': { 'tree': tree } })
    }
  } catch (error) {
    console.error(error)
    return { code: 500, status: 'error', error: error }
  }
}
/**
 * Rebuilds hierarchy category
 * 
 * The following helper function, rebuilds the ancestor fields to ensure correctness. 
 * Your application cannot guarantee that the ancestor list of a parent category is correct, 
 * because MongoDB may process the categories out-of-order.
 * 
 * @param _id 
 * @param parentId 
 * @returns hierarchy category 
 */
export async function rebuildHierarchyCategory(_id: ObjectId, parentId: ObjectId): Promise<any> {

  try {

    // Check DB Connection
    if (!DB.isConnected()) { // trying to reconnect
      await DB.connect();
    } else {

      const dbCollection: Collection = DB.getCollection('category')

      let tree: { _id: ObjectId, name: string, slug: string }[] = []

      while (parentId) {
        const category = await dbCollection.findOne({ '_id': parentId }, { projection: { 'parentId': 1, 'name': 1, 'slug': 1, 'tree._id': 1 } })
        if (!category) break

        parentId = category.parentId as ObjectId
        tree.unshift({ _id: category._id, name: category.name, slug: category.slug })
      }

      dbCollection.updateOne({ '_id': _id }, { '$set': { 'tree': tree } })
    }
  } catch (error) {
    console.error(error)
    return { code: 500, status: 'error', error: error }
  }
}

export async function updateAncestryCategory(dbCollection: Collection, _id: ObjectId, set: any,) {
  // First, you need to update the category name with the following operation
  const Rescat = await dbCollection.updateOne({ _id }, {
    $set: set
  })

  return Rescat
}

export async function reconstructDescendants(dbCollection: Collection, _id: ObjectId): Promise<void> {
  // You can use the following loop to reconstruct all the descendants of the “name” category
  const categories: any = dbCollection.find({ 'tree._id': _id, projection: { 'parentId': 1 } })

  // log('categories:`, categories)
  categories.forEach((category: { _id: ObjectId, parentId: ObjectId }) => {
    rebuildHierarchyCategory(category._id, category.parentId)
  })
}






/* // Map function
export const map = (): any => {

  // We need to save this in a local var as per scoping problems
  var document: ICategory;

  // You need to expand this according to your needs
  var stopwords = ["the","this","and","or"];

  for(var prop in document) {

    // We are only interested in strings and explicitly not in _id
    if(prop === "_id" || typeof document[prop] !== 'string') {
      continue
    }

    (document[prop]).split(" ").forEach(
      function(word: any){

        // You might want to adjust this to your needs
        var cleaned = word.replace(/[;,.]/g,"")

        if(
          // We neither want stopwords...
          stopwords.indexOf(cleaned) > -1 ||
          // ...nor string which would evaluate to numbers
          !(isNaN(parseInt(cleaned))) ||
          !(isNaN(parseFloat(cleaned)))
        ) {
          return
        }
        emit(cleaned,document._id)
      }
    )
  }
};

// Reduce function
export const reduce = (k:any,v: any) => {

    // Kind of ugly, but works.
    // Improvements more than welcome!
    var values = { "documents": ['']};
    v.forEach(
      (el: any) => {
        if(values.documents.indexOf(el)>-1){
          return
        }
        values.documents.push(el)
      }
    )
    return values
  };

export const finalOut: object = {

}

export const MapReduceOfCategories: ModelMapReduceOption<ICategory, any, any> = {
    map,
    reduce,
    // We need this for two reasons...
    finalize: (_key: any, reducedValue: any) => {

        // First, we ensure that each resulting document
        // has the documents field in order to unify access
        var finalValue = {documents:[]}

        // Second, we ensure that each document is unique in said field
        if(reducedValue.documents) {

          // We filter the existing documents array
          finalValue.documents = reducedValue.documents.filter(
            (item:any,pos:any,self:any) => {

              // The default return value
              var loc = -1;

              for(var i=0;i<self.length;i++){
                // We have to do it this way since indexOf only works with primitives

                if(self[i].valueOf() === item.valueOf()){
                  // We have found the value of the current item...
                  loc = i;
                  //... so we are done for now
                  break
                }
              }

              // If the location we found equals the position of item, they are equal
              // If it isn't equal, we have a duplicate
              return loc === pos;
            }
          );
        } else {
          finalValue.documents.push(reducedValue)
        }
        // We have sanitized our data, now we can return it
        return finalValue

      },
    verbose: true,
    // Our result are written to a collection called "categorywords"
    out: { replace: 'CategoryWords'}
}
 */
