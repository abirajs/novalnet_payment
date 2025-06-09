import {
  ComponentOptions,
  PaymentComponent,
  PaymentComponentBuilder,
  PaymentMethod
} from '../../../payment-enabler/payment-enabler';
import { BaseComponent } from "../../base";
import styles from '../../../style/style.module.scss';
import buttonStyles from "../../../style/button.module.scss";
import {
  PaymentOutcome,
  PaymentRequestSchemaDTO,
} from "../../../dtos/mock-payment.dto";
import { BaseOptions } from "../../../payment-enabler/payment-enabler-mock";

export class InvoiceBuilder implements PaymentComponentBuilder {
  public componentHasSubmit = true;
  constructor(private baseOptions: BaseOptions) {}

  build(config: ComponentOptions): PaymentComponent {
    return new Invoice(this.baseOptions, config);
  }
}

export class Invoice extends BaseComponent {
  private showPayButton: boolean;

  constructor(baseOptions: BaseOptions, componentOptions: ComponentOptions) {
    super(PaymentMethod.invoice, baseOptions, componentOptions);
    this.showPayButton = componentOptions?.showPayButton ?? false;
  }

  mount(selector: string) {
    document
      .querySelector(selector)
      .insertAdjacentHTML("afterbegin", this._getTemplate());

    if (this.showPayButton) {
      document
        .querySelector("#invoiceForm-paymentButton")
        .addEventListener("click", (e) => {
          e.preventDefault();
          this.submit();
        });
    }
  }

async submit() {
  console.log("submit-triggered");
  this.sdk.init({ environment: this.environment });
  console.log("sdk-triggered");

  try {
    const requestData: PaymentRequestSchemaDTO = {
      paymentMethod: {
        type: this.paymentMethod,
      },
      paymentOutcome: PaymentOutcome.AUTHORIZED,
    };

    const backendResponse = await fetch(this.processorUrl + "/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": this.sessionId,
      },
      body: JSON.stringify(requestData),
    });
    const backendResult = await backendResponse.json();
    console.log("Backend response:", backendResult);

    if (backendResult.paymentReference) {
      this.onComplete?.({
        isSuccess: true,
        paymentReference: backendResult.paymentReference,
      });
    } else {
      this.onError("Some error occurred. Please try again.");
    }
  } catch (e) {
    console.log("Error occurred:", e);
    this.onError("Some error occurred. Please try again.");
  } finally {
    console.log("Finally code-triggerred");
  }
  console.log("outside of finally code triggered");
}


  private _getTemplate() {
    return this.showPayButton
      ? `
    <div class="${styles.wrapper}">
      <p>Pay easily with Invoice and transfer the shopping amount within the specified date.</p>
      <button class="${buttonStyles.button} ${buttonStyles.fullWidth} ${styles.submitButton}" id="invoiceForm-paymentButton">Pay</button>
    </div>
    `
      : "";
  }
}
