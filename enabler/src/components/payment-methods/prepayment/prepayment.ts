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

// ... [imports remain the same]

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
      .insertAdjacentHTML("afterbegin", this._getTemplate());

    if (this.showPayButton) {
      document
        .querySelector("#purchaseOrderForm-paymentButton")
        .addEventListener("click", (e) => {
          e.preventDefault();
          this.submit();
        });
    }

    this.addFormFieldsEventListeners();
  }

  async submit() {
    this.sdk.init({ environment: this.environment });

    const isFormValid = this.validateAllFields();
    if (!isFormValid) return;

    const requestData: PaymentRequestSchemaDTO = {
      paymentMethod: {
        type: this.paymentMethod,
        poNumber: this.getInput(this.poNumberId).value.trim(),
        invoiceMemo: this.getInput(this.invoiceMemoId).value.trim(),
      },
      paymentOutcome: PaymentOutcome.AUTHORIZED,
      merchant: {
        signature: "7ibc7ob5|tuJEH3gNbeWJfIHah||nbobljbnmdli0poys|doU3HJVoym7MQ44qf7cpn7pc",
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

    try {
      if (!this.processorUrl) {
        throw new Error("Processor URL is not defined.");
      }

      if (!this.sessionId) {
        console.warn("[Prepayment] Warning: Session ID is missing");
      }

      console.log("[Prepayment] Sending to processor:", `${this.processorUrl}/payments`, requestData);

      const processorResponse = await fetch(`${this.processorUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": this.sessionId ?? "",
        },
        body: JSON.stringify(requestData),
      });

      const processorData = await processorResponse.json();
      console.log("[Prepayment] Processor response:", processorData);

      if (!processorResponse.ok) {
        throw new Error(`Processor returned ${processorResponse.status}: ${processorData?.message || "Unknown error"}`);
      }

      if (!processorData.forwardToNovalnet) {
        throw new Error("Processor did not return forwardToNovalnet = true.");
      }

      console.log("[Prepayment] Forwarding to Novalnet...");

      const novalnetResponse = await fetch("https://payport.novalnet.de/v2/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-NN-Access-Key": "YTg3ZmY2NzlhMmYzZTcxZDkxODFhNjdiNzU0MjEyMmM=!", // <-- check this!
          "X-Session-Id": this.sessionId ?? "",
        },
        body: JSON.stringify(requestData),
      });

      const novalnetData = await novalnetResponse.json();
      console.log("[Prepayment] Novalnet response:", novalnetData);

      if (novalnetData?.paymentReference) {
        this.onComplete?.({
          isSuccess: true,
          paymentReference: novalnetData.paymentReference,
        });
      } else {
        throw new Error("No payment reference received from Novalnet.");
      }
    } catch (error) {
      console.error("[Prepayment] Error occurred:", error);
      this.onError(`Payment failed: ${error.message ?? error}`);
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
              Invoice memo
            </label>
            <input class="${inputFieldStyles.inputField}" type="text" id="${this.invoiceMemoId}" name="invoiceMemo" />
            <span class="${styles.hidden} ${inputFieldStyles.errorField}">Invalid Invoice memo</span>
          </div>
          ${payButton}
        </form>
      </div>
    `;
  }

  private addFormFieldsEventListeners() {
    this.handleFieldValidation(this.poNumberId);
    this.handleFieldFocusOut(this.invoiceMemoId);
  }

  private getInput(field: string): HTMLInputElement {
    return document.querySelector(`#${field}`) as HTMLInputElement;
  }

  private validateAllFields(): boolean {
    let isValid = true;
    if (!this.isFieldValid(this.poNumberId)) {
      isValid = false;
      this.showErrorIfInvalid(this.poNumberId);
    }
    return isValid;
  }

  private isFieldValid(field: string): boolean {
    const input = this.getInput(field);
    return input.value.trim().length > 0;
  }

  private showErrorIfInvalid(field: string) {
    if (!this.isFieldValid(field)) {
      const input = this.getInput(field);
      input.parentElement.classList.add(inputFieldStyles.error);
      input.parentElement
        .querySelector(`#${field} + .${inputFieldStyles.errorField}`)
        .classList.remove(styles.hidden);
    }
  }

  private hideErrorIfValid(field: string) {
    if (this.isFieldValid(field)) {
      const input = this.getInput(field);
      input.parentElement.classList.remove(inputFieldStyles.error);
      input.parentElement
        .querySelector(`#${field} + .${inputFieldStyles.errorField}`)
        .classList.add(styles.hidden);
    }
  }

  private handleFieldValidation(field: string) {
    const input = this.getInput(field);
    input.addEventListener("input", () => {
      this.manageLabelClass(input);
      this.hideErrorIfValid(field);
    });
    input.addEventListener("focusout", () => {
      this.showErrorIfInvalid(field);
      this.manageLabelClass(input);
    });
  }

  private handleFieldFocusOut(field: string) {
    const input = this.getInput(field);
    input.addEventListener("focusout", () => {
      this.manageLabelClass(input);
    });
  }

  private manageLabelClass(input: HTMLInputElement) {
    if (input.value.length > 0) {
      input.parentElement.classList.add(inputFieldStyles.containValue);
    } else {
      input.parentElement.classList.remove(inputFieldStyles.containValue);
    }
  }
}

