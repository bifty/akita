import { Observable } from 'rxjs';
import { ID, IDS } from '../types';
import { QueryEntity } from '../queryEntity';
import { isUndefined } from '../isUndefined';
import { coerceArray } from '../coerceArray';
import { toBoolean } from '../toBoolean';
import { isFunction } from '../isFunction';

/**
 * Each plugin that wants to add support for entities should extend this interface.
 */
export type EntityParam = ID;

export type EntityCollectionParams = IDS;

export type RebaseAction<P = any> = (plugin: P) => any;

export type RebaseActions<P = any> = { beforeRemove?: RebaseAction; beforeAdd?: RebaseAction; afterAdd?: RebaseAction };

export abstract class EntityCollectionPlugin<E, P> {
  protected entities = new Map<ID, P>();

  protected constructor(protected query: QueryEntity<any, E>, private entityIds: EntityCollectionParams) {}

  /**
   * Get the entity plugin instance.
   */
  protected getEntity(id: ID): P {
    return this.entities.get(id);
  }

  /**
   * Whether the entity plugin exist.
   */
  protected hasEntity(id: ID): boolean {
    return this.entities.has(id);
  }

  /**
   * Remove the entity plugin instance.
   */
  protected removeEntity(id: ID) {
    this.destroy(id);
    return this.entities.delete(id);
  }

  /**
   * Set the entity plugin instance.
   */
  protected createEntity(id: ID, plugin: P) {
    return this.entities.set(id, plugin);
  }

  /**
   * If the user passes `entityIds` we take them; otherwise, we take all.
   */
  protected getIds(): ID[] {
    return isUndefined(this.entityIds) ? this.query.getValue().ids : coerceArray(this.entityIds);
  }

  /**
   * When you call one of the plugin methods, you can pass id/ids or undefined which means all.
   */
  protected resolvedIds(ids?): ID[] {
    return isUndefined(ids) ? this.getIds() : coerceArray(ids);
  }

  /**
   * Call this method when you want to activate the plugin on init or when you need to listen to add/remove of entities dynamically.
   *
   * For example in your plugin you may do the following:
   *
   * this.query.select(state => state.ids).pipe(skip(1)).subscribe(ids => this.activate(ids));
   */
  protected rebase(ids: ID[], actions: RebaseActions<P> = {}) {
    /**
     *
     * If the user passes `entityIds` & we have new ids check if we need to add/remove instances.
     *
     * This phase will be called only upon update.
     */
    if (toBoolean(ids)) {
      /**
       * Which means all
       */
      if (isUndefined(this.entityIds)) {
        for (let i = 0, len = ids.length; i < len; i++) {
          const entityId = ids[i];
          if (this.hasEntity(entityId) === false) {
            isFunction(actions.beforeAdd) && actions.beforeAdd(entityId);
            const plugin = this.instantiatePlugin(entityId);
            this.entities.set(entityId, plugin);
            isFunction(actions.afterAdd) && actions.afterAdd(plugin);
          }
        }

        this.entities.forEach((plugin, entityId) => {
          if (ids.indexOf(entityId) === -1) {
            isFunction(actions.beforeRemove) && actions.beforeRemove(plugin);
            this.removeEntity(entityId);
          }
        });
      } else {
        /**
         * Which means the user passes specific ids
         */
        const _ids = coerceArray(this.entityIds);
        for (let i = 0, len = _ids.length; i < len; i++) {
          const entityId = _ids[i];
          /** The Entity in current ids and doesn't exist, add it. */
          if (ids.indexOf(entityId) > -1 && this.hasEntity(entityId) === false) {
            isFunction(actions.beforeAdd) && actions.beforeAdd(entityId);
            const plugin = this.instantiatePlugin(entityId);
            this.entities.set(entityId, plugin);
            isFunction(actions.afterAdd) && actions.afterAdd(plugin);
          } else {
            this.entities.forEach((plugin, entityId) => {
              /** The Entity not in current ids and exists, remove it. */
              if (ids.indexOf(entityId) === -1 && this.hasEntity(entityId) === true) {
                isFunction(actions.beforeRemove) && actions.beforeRemove(plugin);
                this.removeEntity(entityId);
              }
            });
          }
        }
      }
    } else {
      /**
       * Otherwise, start with the provided ids or all.
       */
      this.getIds().forEach(id => {
        if (!this.hasEntity(id)) this.createEntity(id, this.instantiatePlugin(id));
      });
    }
  }

  /**
   * Listen for add/remove entities.
   */
  protected selectIds(): Observable<ID[]> {
    return this.query.select(state => state.ids);
  }

  /**
   * Base method for activation, you can override it if you need to.
   */
  protected activate(ids?: ID[]) {
    this.rebase(ids);
  }

  /**
   * This method is responsible for plugin instantiation.
   *
   * For example:
   * return new StateHistory(this.query, this.params, id) as P;
   */
  protected abstract instantiatePlugin(id: ID): P;

  /**
   * This method is responsible for cleaning.
   */
  public abstract destroy(id?: ID);

  /**
   * Loop over each id and invoke the plugin method.
   */
  protected forEachId(ids: IDS, cb: (entity: P) => any) {
    const _ids = this.resolvedIds(ids);

    for (let i = 0, len = _ids.length; i < len; i++) {
      const id = _ids[i];
      if (this.hasEntity(id)) {
        cb(this.getEntity(id));
      }
    }
  }
}
