import { Model, TableOptions } from '@nocobase/database';
import { SaveOptions } from 'sequelize';
import _ from 'lodash';

export class CollectionModel extends Model {

  /**
   * 通过 name 获取 collection
   *
   * @param name 
   */
  static async findByName(name: string) {
    return this.findOne({ where: { name } });
  }

  /**
   * 迁移
   */
  async migrate() {
    const options = await this.getOptions();
    const prevTable = this.database.getTable(this.get('name'));
    // table 是初始化和重新初始化
    const table = this.database.table({...prevTable.getOptions(), ...options});
    return await table.sync({
      force: false,
      alter: {
        drop: false,
      }
    });
  }

  async getFieldsOptions() {
    const fieldsOptions = [];
    const fields = await this.getFields();
    for (const field of fields) {
      fieldsOptions.push(await field.getOptions());
    }
    return fieldsOptions;
  }

  async getOptions(): Promise<TableOptions> {
    return {
      ...this.get('options'),
      name: this.get('name'),
      title: this.get('title'),
      fields: await this.getFieldsOptions(),
    };
  }

  static async import(data: TableOptions, options: SaveOptions = {}): Promise<CollectionModel> {
    data = _.cloneDeep(data);
    const collection = await this.create({
      ...data,
      options: _.omit(data, ['model', 'fields', 'tabs', 'actions', 'views']),
    }, options);
    const items: any = {};
    const associations = ['fields', 'tabs', 'actions', 'views'];
    for (const key of associations) {
      if (!Array.isArray(data[key])) {
        continue;
      }
      items[key] = data[key].map((item, sort) => ({
        ...item,
        options: item,
        sort,
      }));
    }
    await collection.updateAssociations(items, options);
    return collection;
  }
}

export default CollectionModel;
