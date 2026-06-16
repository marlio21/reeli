import { Card } from '../types';
import { downloadVCardFile } from './vcard';

export function downloadVCardFileFromCard(card: Card) {
  downloadVCardFile(card);
}
