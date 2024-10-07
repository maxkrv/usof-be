import { SetMetadata } from '@nestjs/common';

export const AllowNotActivated = () => SetMetadata('allowNotActivated', true);
