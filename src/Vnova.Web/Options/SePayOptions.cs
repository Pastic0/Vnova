namespace Vnova.Web.Options;

public sealed class SePayOptions
{
    public bool Enabled { get; set; }
    public string WebhookApiKey { get; set; } = string.Empty;
    public string BankCode { get; set; } = "BIDV";
    public string BankAccountNumber { get; set; } = "96247Q4W8E";
    public string BankAccountName { get; set; } = "Vnova";
    public string PaymentCodePrefix { get; set; } = "TWAI";
    public int PaymentCodeSuffixLength { get; set; } = 20;
    public bool ValidateAccountNumber { get; set; } = true;
}
