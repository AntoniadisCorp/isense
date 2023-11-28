
export declare interface ICategory {
    _id: string;
    name?: string;
    slug?: string;
    tree?: Array<{ _id: string, name: string, slug: string }>
    desc?: number;
    icon?: string;
    parentId?: string;
    date_added?: Date;
    date_modified: Date;
    disabled?: boolean;
    recyclebin?: boolean
    root?: boolean;
}