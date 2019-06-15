import { Store } from './store';
import { Query } from './query';
import { StoreConfigOptions } from './storeConfig';
import { EntityStore } from './entityStore';
import { QueryEntity } from './queryEntity';
import { QueryConfigOptions } from './queryConfig';

export function createStore<State>(initialState: Partial<State>, options: Partial<StoreConfigOptions>) {
  return new Store<State>(initialState, options);
}

export function createQuery<State>(store: Store<State>) {
  return new Query<State>(store);
}

export function createEntityStore<State, Entity>(initialState: Partial<State>, options: Partial<StoreConfigOptions>) {
  return new EntityStore<State, Entity>(initialState, options);
}

export function createEntityQuery<State, Entity>(store: EntityStore<State, Entity>, options: QueryConfigOptions) {
  return new QueryEntity<State, Entity>(store, options);
}
