import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddMovieToListData {
  movieListEntry_insert: MovieListEntry_Key;
}

export interface AddMovieToListVariables {
  movieListId: UUIDString;
  movieId: UUIDString;
  position: number;
}

export interface CreatePublicMovieListData {
  movieList_insert: MovieList_Key;
}

export interface CreatePublicMovieListVariables {
  name: string;
  description: string;
}

export interface GetMyMovieListsData {
  movieLists: ({
    id: UUIDString;
    name: string;
    description?: string | null;
  } & MovieList_Key)[];
}

export interface GetPublicMovieListsData {
  movieLists: ({
    id: UUIDString;
    name: string;
    description?: string | null;
  } & MovieList_Key)[];
}

export interface MovieListEntry_Key {
  position: number;
  movieListId: UUIDString;
  movieId: UUIDString;
  __typename?: 'MovieListEntry_Key';
}

export interface MovieList_Key {
  id: UUIDString;
  __typename?: 'MovieList_Key';
}

export interface Movie_Key {
  id: UUIDString;
  __typename?: 'Movie_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface Watch_Key {
  id: UUIDString;
  __typename?: 'Watch_Key';
}

interface CreatePublicMovieListRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePublicMovieListVariables): MutationRef<CreatePublicMovieListData, CreatePublicMovieListVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePublicMovieListVariables): MutationRef<CreatePublicMovieListData, CreatePublicMovieListVariables>;
  operationName: string;
}
export const createPublicMovieListRef: CreatePublicMovieListRef;

export function createPublicMovieList(vars: CreatePublicMovieListVariables): MutationPromise<CreatePublicMovieListData, CreatePublicMovieListVariables>;
export function createPublicMovieList(dc: DataConnect, vars: CreatePublicMovieListVariables): MutationPromise<CreatePublicMovieListData, CreatePublicMovieListVariables>;

interface GetPublicMovieListsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicMovieListsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicMovieListsData, undefined>;
  operationName: string;
}
export const getPublicMovieListsRef: GetPublicMovieListsRef;

export function getPublicMovieLists(): QueryPromise<GetPublicMovieListsData, undefined>;
export function getPublicMovieLists(dc: DataConnect): QueryPromise<GetPublicMovieListsData, undefined>;

interface AddMovieToListRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddMovieToListVariables): MutationRef<AddMovieToListData, AddMovieToListVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddMovieToListVariables): MutationRef<AddMovieToListData, AddMovieToListVariables>;
  operationName: string;
}
export const addMovieToListRef: AddMovieToListRef;

export function addMovieToList(vars: AddMovieToListVariables): MutationPromise<AddMovieToListData, AddMovieToListVariables>;
export function addMovieToList(dc: DataConnect, vars: AddMovieToListVariables): MutationPromise<AddMovieToListData, AddMovieToListVariables>;

interface GetMyMovieListsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyMovieListsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyMovieListsData, undefined>;
  operationName: string;
}
export const getMyMovieListsRef: GetMyMovieListsRef;

export function getMyMovieLists(): QueryPromise<GetMyMovieListsData, undefined>;
export function getMyMovieLists(dc: DataConnect): QueryPromise<GetMyMovieListsData, undefined>;

