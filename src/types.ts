export type Severity = 'Low' | 'Medium' | 'High';

export interface AbnormalFlag {
  parameter: string;
  value: string;
  normal_range?: string;
  severity: Severity;
  explanation: string;
}

export interface ReportSummary {
  id: string;
  date: string;
  report_type: string;
  patient_age?: number;
  patient_gender?: string;
  key_findings: string[];
  plain_summary: string;
  abnormal_flags: AbnormalFlag[];
  recommendations: string[];
  disclaimer: string;
}

export interface ComparisonData {
  parameter: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend: 'improved' | 'worsened' | 'stable';
}
