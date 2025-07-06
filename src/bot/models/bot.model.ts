import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

interface IBotCreationAttr {
  user_id: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  lang: string | undefined;
  name: string | undefined;
  role: string | undefined;
  phone_number: string | undefined;
  last_state: string | undefined;
  status: boolean | undefined;
}

@Table({ tableName: "user" })
export class Bot extends Model<Bot, IBotCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
  })
  declare user_id: string;

  @Column({
    type: DataType.STRING,
  })
  declare first_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  declare last_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  declare lang: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  declare name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  declare role: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  declare phone_number: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  declare last_state: string | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare location: string | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare region: string | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare district: string | undefined;
  @Column({
    type: DataType.BOOLEAN,
  })
  declare status: boolean | undefined;
}
