import { Request } from 'express';
import { diskStorage } from 'multer';
import { basename, extname } from 'node:path';

export const upload = {
  storage: diskStorage({
    destination: './public/uploads',
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const originalName = basename(
        file.originalname,
        extname(file.originalname),
      );

      const randomName = Date.now();
      const finalName = `${randomName}___${originalName}${extname(file.originalname)}`;
      cb(null, finalName);
    },
  }),

  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    cb(null, true);
  },

  limits: {
    fileSize: 50 * 1024 * 1024,
  },
};
