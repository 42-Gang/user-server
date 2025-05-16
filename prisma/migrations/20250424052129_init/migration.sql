-- AddForeignKey
ALTER TABLE `friend` ADD CONSTRAINT `friend_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend` ADD CONSTRAINT `friend_friend_id_fkey` FOREIGN KEY (`friend_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
