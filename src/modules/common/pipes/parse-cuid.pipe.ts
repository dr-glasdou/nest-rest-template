import { BadRequestException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { getConstants, isCuid } from '@paralleldrive/cuid2';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string) {
    const { defaultLength } = getConstants();

    if (!isCuid(value, { minLength: defaultLength, maxLength: defaultLength }))
      throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: 'Value provided is not a valid CUID' });

    return value;
  }
}
