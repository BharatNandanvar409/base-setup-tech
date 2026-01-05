import { BelongsTo, Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";
import { TaskBoard } from "./task-board.model";
import { Users } from "./user.model";

@Table({
    tableName: "task_assigned_users",
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ["taskBoardId", "userId"],
            unique: true
        }
    ]
})

export class TaskAssignedUsers extends Model<TaskAssignedUsers> {
      @PrimaryKey
      @Default(DataType.UUIDV4)
      @Column(DataType.UUID)
      declare id?: string;

      @Column({
        field: "taskBoardId",
        type: DataType.UUID,
        allowNull: false
      })
      declare taskBoardId?: string;

      @Column({
        field: "userId",
        type: DataType.UUID,
        allowNull: false
      })
      declare userId?: string;


    @Column({
        field: "taskId",
        type: DataType.UUID,
        allowNull: false
    })
    declare taskId?: string;


    @BelongsTo(() => TaskBoard, {
        foreignKey: "taskBoardId",
        as: "taskBoard"
    })
    declare taskBoard?: TaskBoard;


    @BelongsTo(() => Users, {
        foreignKey: "userId",
        as: "user"
    })
    declare user?: Users;
}