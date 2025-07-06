import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({ tableName: "muruvvat" })
export class Muruvvat extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING })
  declare user_id: string;

  @Column({ type: DataType.STRING })
  declare text: string;
}
