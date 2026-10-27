export type BlockType = 'text' | 'bullets' | 'numbered' | 'group';

export type TextBlock = {
  id: string;
  type: 'text';
  content: string;
  hint?: string;
};

export type BulletsBlock = {
  id: string;
  type: 'bullets';
  items: string[];
  hint?: string;
};

export type NumberedBlock = {
  id: string;
  type: 'numbered';
  items: string[];
  hint?: string;
};

export type GroupBlock = {
  id: string;
  type: 'group';
  title: string;
  items: string[];
  hint?: string;
  bulletHint?: string;
};

export type Block = TextBlock | BulletsBlock | NumberedBlock | GroupBlock;

export type Section = {
  id: string;
  heading: string;
  blocks: Block[];
};

export type Quotation = {
  id: string;
  title: string;
  titleManual?: boolean;
  createdAt: number;
  updatedAt: number;
  sections: Section[];
};

export type BankDetails = {
  holder: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  swift: string;
  upiId: string;
};

export type Settings = {
  agencyName: string;
  address: string;
  logo: {
    kind: 'prebuilt' | 'custom';
    src: string;
  };
  paymentEnabled: boolean;
  bank: BankDetails;
  qrImage?: string;
};

export type AppState = {
  quotations: Quotation[];
  activeQuotationId: string;
  settings: Settings;
  isSaved: boolean;
  storageError: boolean;
};
