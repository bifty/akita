import { ID, IDS } from '../../types';
import { QueryEntity } from '../../queryEntity';
import { StateHistoryPlugin, StateHistoryParams } from './stateHistoryPlugin';
import { toBoolean } from '../../toBoolean';
import { skip } from 'rxjs/operators';
import { EntityCollectionPlugin, EntityCollectionParams } from '../entityCollectionPlugin';

export interface StateHistoryEntityParams extends StateHistoryParams {
  entityIds?: EntityCollectionParams;
}

export class EntityStateHistoryPlugin<E, P extends StateHistoryPlugin<E, any> = StateHistoryPlugin<E, any>> extends EntityCollectionPlugin<E, P> {
  constructor(protected query: QueryEntity<any, E>, protected readonly params: StateHistoryEntityParams = {}) {
    super(query, params.entityIds);
    params.maxAge = toBoolean(params.maxAge) ? params.maxAge : 10;
    this.activate();
    this.selectIds()
      .pipe(skip(1))
      .subscribe(ids => this.activate(ids));
  }

  redo(ids?: IDS) {
    this.forEachId(ids, e => e.redo());
  }

  undo(ids?: IDS) {
    this.forEachId(ids, e => e.undo());
  }

  hasPast(id: ID) {
    if (this.hasEntity(id)) {
      return this.getEntity(id).hasPast;
    }
  }

  hasFuture(id: ID) {
    if (this.hasEntity(id)) {
      return this.getEntity(id).hasFuture;
    }
  }

  jumpToFuture(ids: IDS, index: number) {
    this.forEachId(ids, e => e.jumpToFuture(index));
  }

  jumpToPast(ids: IDS, index: number) {
    this.forEachId(ids, e => e.jumpToPast(index));
  }

  clear(ids?: IDS) {
    this.forEachId(ids, e => e.clear());
  }

  destroy(ids?: IDS, clearHistory = false) {
    this.forEachId(ids, e => e.destroy(clearHistory));
  }

  ignoreNext(ids?: IDS) {
    this.forEachId(ids, e => e.ignoreNext());
  }

  protected instantiatePlugin(id: ID) {
    return new StateHistoryPlugin<E, any>(this.query, this.params, id) as P;
  }
}
