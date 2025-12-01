class Magazine {
  constructor(issueNumber, modelId, isSpecial, hasInsert) {
    this.issueNumber = issueNumber;
    this.modelId = modelId;
    this.isSpecial = isSpecial;
    this.cardInsert = false;
  }

  // insertMagazine() {
  //   console.log('Hello Model');
  //   db.run(`UPDATE Issues SET modelID = ${this.modelId.id}, isSpecial = ${this.isSpecial}, hasInsert = ${this.cardInsert} WHERE issueNumber = "${this.issueNumber}"`);
  //   // await db.run(`UPDATE Issues SET modelID = ${modelId.id}, isSpecial = ${isSpecial}, hasInsert = ${cardInsert} WHERE issueNumber = "${issue['Issue Number']}"`);
  //   return
  // }
}

module.exports = Magazine;