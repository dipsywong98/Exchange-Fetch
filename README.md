# Exchange-Fetch
Fetch all data from http://arr.ust.hk/ust_actoe/credit_overseas.php

Live website:
https://dipsywong98.github.io/Exchange-Fetch/

Pull requests are welcomed! Watch to see the latest update.

Fetching data uses nodejs to parse the website and generate `transfers.json` in format of a credit transfer entry array. For each credit transfer entry, it contains these keys:

```JSON
{
"Institute":"Commercial College of Iceland",
"Institute_id":"X027",
"Country":"Algeria",
"Subject":"Administration /  Business Management",
"Course Code":"STJ103 ",
"HKUST Equivalent Course":"MGMT 1110: Introduction to Management ",
"Credits":"3.00",
"Restriction":"GD:8",
"Valid Until":"2020-21 Summer",
"DB Ref. No.":"B11327"
}
```


