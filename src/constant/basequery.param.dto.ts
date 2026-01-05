export class BaseQueryParamsDTO {
    pageNum?: string;
    pageLimit?: string;
    search?: string;
    sortField?: string;
    sortOrder?: string;
    id?: string;
    indexId?: string;
    createdAt?: string;
    updatedAt?: string;
    status?: string;
}


export class GetAllUserQueryParamsDTO extends BaseQueryParamsDTO {
    name?: string;
    gender?: string;
    email?: string;
    phone?: string;
    username?: string;
    role?: string;
}


export class GetAllProductQueryParamsDTO extends BaseQueryParamsDTO {
    name?: string;
    price?: string;
    category?: string;
}