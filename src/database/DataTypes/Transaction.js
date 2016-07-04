import Realm from 'realm';
import {
  addLineToParent,
  generateUUID,
  getTotal,
} from '../utilities';

export class Transaction extends Realm.Object {
  get isFinalised() {
    return this.status === 'finalised';
  }

  get totalPrice() {
    return getTotal(this.items, 'totalPrice');
  }

  // Adds a TransactionLine, incorporating it into a matching TransactionItem
  addLine(database, transactionLine) {
    addLineToParent(transactionLine, this, () =>
      database.create('TransactionItem', {
        id: generateUUID(),
        item: transactionLine.itemLine.item,
        transaction: this,
      })
    );
  }

  finalise(database, user) {
    this.status = 'finalised';
    if (this.type === 'supplier_invoice') { // If a supplier invoice, add item lines to inventory
      this.enteredBy = user;
      this.items.forEach((transactionItem) => {
        transactionItem.lines.forEach((transactionLine) => {
          const itemLine = transactionLine.itemLine;
          itemLine.packSize = transactionLine.packSize;
          itemLine.numberOfPacks = transactionLine.numberOfPacks;
          itemLine.expiryDate = transactionLine.expiryDate;
          itemLine.batch = transactionLine.batch;
          itemLine.costPrice = transactionLine.costPrice;
          itemLine.sellPrice = transactionLine.sellPrice;
          database.save('ItemLine', itemLine);
          database.save('TransactionLine', transactionLine);
        });
      });
    }
  }
}