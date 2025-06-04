import { Static, Type } from '@sinclair/typebox';

export enum PaymentOutcome {
  AUTHORIZED = 'Authorized',
  REJECTED = 'Rejected',
}

export enum PaymentMethodType {
  CARD = 'card',
  INVOICE = 'invoice',
  PREPAYMENT = 'prepayment',
}

export const PaymentResponseSchema = Type.Object({
  paymentReference: Type.String(),
});

export const PaymentOutcomeSchema = Type.Enum(PaymentOutcome);

export const PaymentRequestSchema = Type.Object({
  paymentMethod: Type.Object({
    type: Type.Enum(PaymentMethodType),
    poNumber: Type.Optional(Type.String()),
    invoiceMemo: Type.Optional(Type.String()),
  }),
  paymentOutcome: PaymentOutcomeSchema,
  merchant:  Type.Object({
    signature: Type.Optional(Type.String()),
    tariff: Type.Optional(Type.String()),
  }),
  customer: Type.Object({
    first_name: Type.Optional(Type.String()),
    last_name: Type.Optional(Type.String()),
    email: Type.Optional(Type.String()),
 }),
  transaction: Type.Object({
    test_mode: Type.Optional(Type.String()),
    payment_type: Type.Optional(Type.String()),
    amount: Type.Optional(Type.String()),
    currency: Type.Optional(Type.String()),
 }),
});

export type PaymentRequestSchemaDTO = Static<typeof PaymentRequestSchema>;
export type PaymentResponseSchemaDTO = Static<typeof PaymentResponseSchema>;
