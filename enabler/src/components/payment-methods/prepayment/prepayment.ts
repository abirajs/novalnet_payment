import {
  ComponentOptions,
  PaymentComponent,
  PaymentComponentBuilder,
  PaymentMethod,
} from "../../../payment-enabler/payment-enabler";
import { BaseComponent } from "../../base";
import inputFieldStyles from "../../../style/inputField.module.scss";
import styles from "../../../style/style.module.scss";
import buttonStyles from "../../../style/button.module.scss";
import {
  PaymentOutcome,
  PaymentRequestSchemaDTO,
} from "../../../dtos/mock-payment.dto";
import { BaseOptions } from "../../../payment-enabler/payment-enabler-mock";

export class PrepaymentBuilder implements PaymentComponentBuilder {
  public componentHasSubmit = true;

  constructor(private baseOptions: BaseOptions) {}

  build(config: ComponentOptions): PaymentComponent {
    return new Prepayment(this.baseOptions, config);
  }
}

export class Prepayment extends BaseComponent {
  private showPayButton: boolean;
  private poNumberId = "purchaseOrderForm-poNumber";
  private invoiceMemoId = "purchaseOrderForm-invoiceMemo";

  constructor(baseOptions: BaseOptions, componentOptions: ComponentOptions) {
    super(PaymentMethod.prepayment, baseOptions, componentOptions);
    this.showPayButton = componentOptions?.showPayButton ?? false;
  }

  mount(selector: string) {
    document
      .querySelector(selector)
      ?.insertAdjacentHTML("afterbegin", this._getTemplate());

    if (this.showPayButton) {
      document
        .querySelector("#purchaseOrderForm-paymentButton")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          this.submit();
        });
    }

    this.addFormFieldsEventListeners();
  }

  async submit() {
    try {
      this.sdk.init({ environment: this.environment });

      if (!this.validateAllFields()) {
        return;
      }

      const requestData: PaymentRequestSchemaDTO = {
        paymentMethod: {
          type: this.paymentMethod,
          poNumber: this.getInput(this.poNumberId).value.trim(),
          invoiceMemo: this.getInput(this.invoiceMemoId).value.trim(),
        },
        paymentOutcome: PaymentOutcome.AUTHORIZED,
        merchant: {
          signature: "sample-merchant-signature",
          tariff: "10004",
        },
        customer: {
          first_name: "Max",
          last_name: "Mustermann",
          email: "abiraj_s@novalnetsolutions.com",
        },
        transaction: {
          test_mode: "1",
          payment_type: "PREPAYMENT",
          amount: "10",
          currency: "EUR",
        },
      };

      console.log("[Prepayment] Sending requestData to processor:", requestData);

      const response = await fetch(`${this.processorUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Session-Id": this.sessionId,
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (response.ok && responseData?.paymentReference) {
        this.onComplete?.({
          isSuccess: true,
          paymentReference: responseData.paymentReference,
        });
      } else {
        this.onError("Error processing payment. Please try again.");
      }
    } catch (error) {
      console.error("[Prepayment] Submission error:", error);
      this.onError("Unexpected error occurred.");
    }
  }

  showValidation() {
    this.validateAllFields();
  }

  isValid() {
    return this.validateAllFields();
  }

  private _getTemplate() {
    const payButton = this.showPayButton
      ? `<button class="${buttonStyles.button} ${buttonStyles.fullWidth} ${styles.submitButton}" id="purchaseOrderForm-paymentButton">Pay</button>`
      : "";

    return `
      <div class="${styles.wrapper}">
        <form class="${styles.paymentForm}">
          <div class="${inputFieldStyles.inputContainer}">
            <label class="${inputFieldStyles.inputLabel}" for="${this.poNumberId}">
              PO Number <span aria-hidden="true"> *</span>
            </label>
            <input class="${inputFieldStyles.inputField}" type="text" id="${this.poNumberId}" name="poNumber" />
            <span class="${styles.hidden} ${inputFieldStyles.errorField}">Invalid PO number</span>
          </div>
          <div class="${inputFieldStyles.inputContainer}">
            <label class="${inputFieldStyles.inputLabel}" for="${this.invoiceMemoId}">
              Invoice Memo
            </label>
            <input class="${inputFieldStyles.inputField}" type="text" id="${this.invoiceMemoId}" name="invoiceMemo" />
            <span class="${styles.hidden} ${inputFieldStyles.errorField}">Invalid Invoice memo</span>
          </div>
          ${payButton}
        </form>
      </div>
    `;
  }

  private getInput(fieldId: string): HTMLInputElement {
    return document.querySelector(`#${fieldId}`) as HTMLInputElement;
  }

  private validateAllFields(): boolean {
    const isPOValid = this.isFieldValid(this.poNumberId);

    if (!isPOValid) {
      this.showErrorIfInvalid(this.poNumberId);
    }

    return isPOValid;
  }

  private isFieldValid(fieldId: string): boolean {
    const input = this.getInput(fieldId);
    return input && input.value.trim().length > 0;
  }

  private showErrorIfInvalid(fieldId: string) {
    const input = this.getInput(fieldId);
    input?.parentElement?.classList.add(inputFieldStyles.error);
    input?.parentElement
      ?.querySelector(`#${fieldId} + .${inputFieldStyles.errorField}`)
      ?.classList.remove(styles.hidden);
  }

  private hideErrorIfValid(fieldId: string) {
    const input = this.getInput(fieldId);
    if (this.isFieldValid(fieldId)) {
      input?.parentElement?.classList.remove(inputFieldStyles.error);
      input?.parentElement
        ?.querySelector(`#${fieldId} + .${inputFieldStyles.errorField}`)
        ?.classList.add(styles.hidden);
    }
  }

  private handleFieldValidation(fieldId: string) {
    const input = this.getInput(fieldId);
    input?.addEventListener("input", () => {
      this.manageLabelClass(input);
      this.hideErrorIfValid(fieldId);
    });
    input?.addEventListener("focusout", () => {
      this.showErrorIfInvalid(fieldId);
      this.manageLabelClass(input);
    });
  }

  private handleFieldFocusOut(fieldId: string) {
    const input = this.getInput(fieldId);
    input?.addEventListener("focusout", () => {
      this.manageLabelClass(input);
    });
  }

  private manageLabelClass(input: HTMLInputElement) {
    if (input?.value?.length > 0) {
      input.parentElement?.classList.add(inputFieldStyles.containValue);
    } else {
      input.parentElement?.classList.remove(inputFieldStyles.containValue);
    }
  }

  private addFormFieldsEventListeners() {
    this.handleFieldValidation(this.poNumberId);
    this.handleFieldFocusOut(this.invoiceMemoId);
  }
}
