import { ID, EntityState } from './../src/types';
import { StoreConfig } from '../src/storeConfig';
import { EntityStore } from '../src/entityStore';

interface Article {
  id: ID;
  title: string;
  moreInfo?: {
    description: string;
  };
}

interface ArticlesState extends EntityState<Article> {}

@StoreConfig({ name: 'articles' })
class ArticlesStore extends EntityStore<ArticlesState, Article> {}

const store = new ArticlesStore();

describe('upsert', () => {
  it('should add if not exist - one', () => {
    store.upsert(1, { title: 'new title' });
    expect(store._value().entities[1].title).toEqual('new title');
    expect(store._value().entities[1].id).toBe(1);
    store.remove();
  });

  it('should add if not exist - many', () => {
    store.upsert([2, 3], { title: 'new title' });
    expect(store._value().entities[2].title).toEqual('new title');
    expect(store._value().entities[2].id).toBe(2);
    expect(store._value().entities[3].title).toEqual('new title');
    expect(store._value().entities[3].id).toBe(3);
    expect(store._value().ids.length).toBe(2);
    store.remove();
  });

  it('should update if exist', () => {
    store.add([{ id: 1, title: '' }]);
    store.upsert(1, { title: 'new title' });
    expect(store._value().entities[1].title).toEqual('new title');
    store.upsert(1, { title: 'new title2' });
    expect(store._value().entities[1].title).toEqual('new title2');
    expect(store._value().ids.length).toBe(1);
    store.remove();
  });

  describe('UpsertMany', () => {
    it('should support array of entities', () => {
      const data = [{ id: 1, title: '1', moreInfo: { description: 'desc1' } }, { id: 2, title: '2', moreInfo: { description: 'desc2' } }];
      store.set(data);
      expect(store._value().ids.length).toBe(2);
      const baseData: Article[] = [{ id: 1, title: '1' }, { id: 2, title: '2' }];

      store.upsertMany(baseData);

      expect(store._value().entities[1]).toEqual({
        id: 1,
        title: '1',
        moreInfo: { description: 'desc1' }
      });
    });
  });
});
