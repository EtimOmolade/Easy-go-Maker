import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  userId: string;
}

interface ParsedPrayer {
  category: string;
  title: string;
  content: string;
  // Kingdom Focus fields
  month?: string;
  day?: number;
  year?: number;
  day_of_week?: string;
  intercession_number?: number;
  // Listening Prayer fields
  cycle_number?: number;
  day_number?: number;
  chapter?: number;
  start_verse?: number;
  end_verse?: number;
  reference_text?: string;
  // Validation
  errors?: string[];
  rowNumber?: number;
}

export function BulkImportDialog({ open, onOpenChange, onImportComplete, userId }: BulkImportDialogProps) {
  const [parsedData, setParsedData] = useState<ParsedPrayer[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ success: number; failed: number } | null>(null);

  const downloadCSVTemplate = (category: 'Kingdom Focus' | 'Listening Prayer') => {
    let csvContent = '';

    if (category === 'Kingdom Focus') {
      csvContent = `category,title,content,month,day,year,day_of_week,intercession_number
Kingdom Focus,July 1 Intercession 1,"Father, thank You for Your manifest presence in our midst all through the first half of 2025...",July,1,2025,tuesday,1
Kingdom Focus,July 1 Intercession 2,"Father, we decree the rescue of every captive of hell unto salvation...",July,1,2025,tuesday,2
Kingdom Focus,July 1 Intercession 3,"Lord Jesus, trigger new waves of signs and wonders by Your Word...",July,1,2025,tuesday,3
Kingdom Focus,July 1 Intercession 4,"Father, let this church be minimum double her current attendance...",July,1,2025,tuesday,4`;
    } else {
      csvContent = `category,title,content,day_number,chapter,start_verse,end_verse,reference_text,cycle_number
Listening Prayer,Proverbs 1:1-10,"Read Proverbs 1:1-10. Meditate on the wisdom found in this passage and ask God to speak to you.",1,1,1,10,Proverbs 1:1-10,1
Listening Prayer,Proverbs 1:11-20,"Read Proverbs 1:11-20. Meditate on the wisdom found in this passage and ask God to speak to you.",2,1,11,20,Proverbs 1:11-20,1
Listening Prayer,Proverbs 1:21-33,"Read Proverbs 1:21-33. Meditate on the wisdom found in this passage and ask God to speak to you.",3,1,21,33,Proverbs 1:21-33,1`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.toLowerCase().replace(' ', '_')}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`${category} CSV template downloaded`);
  };

  const downloadJSONTemplate = (category: 'Kingdom Focus' | 'Listening Prayer') => {
    let jsonData: any[] = [];

    if (category === 'Kingdom Focus') {
      jsonData = [
        {
          category: "Kingdom Focus",
          title: "July 1 Intercession 1",
          content: "Father, thank You for Your manifest presence in our midst all through the first half of 2025...",
          month: "July",
          day: 1,
          year: 2025,
          day_of_week: "tuesday",
          intercession_number: 1
        },
        {
          category: "Kingdom Focus",
          title: "July 1 Intercession 2",
          content: "Father, we decree the rescue of every captive of hell unto salvation...",
          month: "July",
          day: 1,
          year: 2025,
          day_of_week: "tuesday",
          intercession_number: 2
        }
      ];
    } else {
      jsonData = [
        {
          category: "Listening Prayer",
          title: "Proverbs 1:1-10",
          content: "Read Proverbs 1:1-10. Meditate on the wisdom found in this passage and ask God to speak to you.",
          day_number: 1,
          chapter: 1,
          start_verse: 1,
          end_verse: 10,
          reference_text: "Proverbs 1:1-10",
          cycle_number: 1
        },
        {
          category: "Listening Prayer",
          title: "Proverbs 1:11-20",
          content: "Read Proverbs 1:11-20. Meditate on the wisdom found in this passage and ask God to speak to you.",
          day_number: 2,
          chapter: 1,
          start_verse: 11,
          end_verse: 20,
          reference_text: "Proverbs 1:11-20",
          cycle_number: 1
        }
      ];
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.toLowerCase().replace(' ', '_')}_template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`${category} JSON template downloaded`);
  };

  const parseCSV = (text: string): ParsedPrayer[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      toast.error('CSV file is empty or invalid');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const prayers: ParsedPrayer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Handle CSV with quoted fields
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      const prayer: any = { rowNumber: i + 1, errors: [] };

      headers.forEach((header, index) => {
        const value = values[index]?.replace(/^"|"$/g, '').trim();
        if (value) {
          // Convert numeric fields
          if (['day', 'year', 'intercession_number', 'cycle_number', 'day_number', 'chapter', 'start_verse', 'end_verse'].includes(header)) {
            prayer[header] = parseInt(value);
          } else {
            prayer[header] = value;
          }
        }
      });

      prayers.push(prayer);
    }

    return prayers;
  };

  const validatePrayer = (prayer: ParsedPrayer): string[] => {
    const errors: string[] = [];

    // Required fields for all
    if (!prayer.category) errors.push('Missing category');
    if (!prayer.title) errors.push('Missing title');
    if (!prayer.content) errors.push('Missing content');

    // Category must be valid
    if (prayer.category && !['Kingdom Focus', 'Listening Prayer'].includes(prayer.category)) {
      errors.push(`Invalid category: ${prayer.category}`);
    }

    // Kingdom Focus validation
    if (prayer.category === 'Kingdom Focus') {
      if (!prayer.month) errors.push('Missing month');
      if (!prayer.day) errors.push('Missing day');
      if (!prayer.year) errors.push('Missing year');
      if (!prayer.day_of_week) errors.push('Missing day_of_week');
      if (!prayer.intercession_number) errors.push('Missing intercession_number');

      // Validate values
      if (prayer.day && (prayer.day < 1 || prayer.day > 31)) {
        errors.push('Day must be 1-31');
      }
      if (prayer.intercession_number && (prayer.intercession_number < 1 || prayer.intercession_number > 4)) {
        errors.push('Intercession number must be 1-4');
      }
    }

    // Listening Prayer validation
    if (prayer.category === 'Listening Prayer') {
      if (!prayer.day_number) errors.push('Missing day_number');
      if (!prayer.chapter) errors.push('Missing chapter');
      if (!prayer.start_verse) errors.push('Missing start_verse');
      if (!prayer.end_verse) errors.push('Missing end_verse');
      if (!prayer.reference_text) errors.push('Missing reference_text');

      // Validate values
      if (prayer.day_number && (prayer.day_number < 1 || prayer.day_number > 91)) {
        errors.push('Day number must be 1-91');
      }
      if (prayer.chapter && (prayer.chapter < 1 || prayer.chapter > 31)) {
        errors.push('Chapter must be 1-31');
      }
    }

    return errors;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'json') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let prayers: ParsedPrayer[] = [];

      if (type === 'csv') {
        prayers = parseCSV(text);
      } else {
        const jsonData = JSON.parse(text);
        prayers = Array.isArray(jsonData) ? jsonData : [jsonData];
        prayers = prayers.map((p, i) => ({ ...p, rowNumber: i + 1, errors: [] }));
      }

      // Validate all prayers
      prayers.forEach(prayer => {
        prayer.errors = validatePrayer(prayer);
      });

      setParsedData(prayers);
      setImportStats(null);

      const validCount = prayers.filter(p => p.errors!.length === 0).length;
      const invalidCount = prayers.length - validCount;

      if (invalidCount > 0) {
        toast.warning(`Parsed ${prayers.length} prayers: ${validCount} valid, ${invalidCount} invalid`);
      } else {
        toast.success(`Parsed ${prayers.length} prayers successfully!`);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(`Failed to parse ${type.toUpperCase()} file`);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleImport = async () => {
    const validPrayers = parsedData.filter(p => p.errors!.length === 0);

    if (validPrayers.length === 0) {
      toast.error('No valid prayers to import');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      // Batch insert (Supabase can handle up to 1000 rows)
      const batchSize = 100;

      for (let i = 0; i < validPrayers.length; i += batchSize) {
        const batch = validPrayers.slice(i, i + batchSize);
        const insertData = batch.map(prayer => {
          const data: any = {
            category: prayer.category,
            title: prayer.title,
            content: prayer.content,
            created_by: userId
          };

          // Add Kingdom Focus fields
          if (prayer.category === 'Kingdom Focus') {
            if (prayer.month) data.month = prayer.month;
            if (prayer.day) data.day = prayer.day;
            if (prayer.year) data.year = prayer.year;
            if (prayer.day_of_week) data.day_of_week = prayer.day_of_week;
            if (prayer.intercession_number) data.intercession_number = prayer.intercession_number;
          }

          // Add Listening Prayer fields
          if (prayer.category === 'Listening Prayer') {
            if (prayer.cycle_number) data.cycle_number = prayer.cycle_number;
            if (prayer.day_number) data.day_number = prayer.day_number;
            if (prayer.chapter) data.chapter = prayer.chapter;
            if (prayer.start_verse) data.start_verse = prayer.start_verse;
            if (prayer.end_verse) data.end_verse = prayer.end_verse;
            if (prayer.reference_text) data.reference_text = prayer.reference_text;
          }

          return data;
        });

        const { error } = await supabase
          .from('prayer_library')
          .insert(insertData);

        if (error) {
          console.error('Batch insert error:', error);
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      setImportStats({ success: successCount, failed: failedCount });

      if (failedCount > 0) {
        toast.warning(`Imported ${successCount} prayers, ${failedCount} failed`);
      } else {
        toast.success(`Successfully imported ${successCount} prayers!`);
      }

      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import prayers');
    } finally {
      setImporting(false);
    }
  };

  const clearData = () => {
    setParsedData([]);
    setImportStats(null);
  };

  const validPrayers = parsedData.filter(p => p.errors!.length === 0);
  const invalidPrayers = parsedData.filter(p => p.errors!.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Prayer Points</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="templates">Download Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <Label htmlFor="csv-upload" className="block">
                    <span className="text-sm font-medium">Upload CSV File</span>
                  </Label>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e, 'csv')}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose CSV File
                    </label>
                  </Button>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <Label htmlFor="json-upload" className="block">
                    <span className="text-sm font-medium">Upload JSON File</span>
                  </Label>
                  <input
                    id="json-upload"
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileUpload(e, 'json')}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="json-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose JSON File
                    </label>
                  </Button>
                </div>
              </div>

              {parsedData.length > 0 && (
                <>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-medium">{validPrayers.length} Valid Prayers</span>
                      </div>
                      {invalidPrayers.length > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium">{invalidPrayers.length} Invalid Prayers</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={clearData} size="sm">
                        Clear
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={validPrayers.length === 0 || importing}
                        size="sm"
                      >
                        {importing ? 'Importing...' : `Import ${validPrayers.length} Prayers`}
                      </Button>
                    </div>
                  </div>

                  {importStats && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-900">
                        Import Complete: {importStats.success} succeeded, {importStats.failed} failed
                      </p>
                    </div>
                  )}

                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Row</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.slice(0, 20).map((prayer, index) => (
                            <TableRow key={index}>
                              <TableCell>{prayer.rowNumber}</TableCell>
                              <TableCell className="font-medium">{prayer.category}</TableCell>
                              <TableCell>{prayer.title}</TableCell>
                              <TableCell className="max-w-md truncate">{prayer.content}</TableCell>
                              <TableCell>
                                {prayer.errors!.length === 0 ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-xs text-red-600">
                                      {prayer.errors!.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {parsedData.length > 20 && (
                      <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                        Showing first 20 of {parsedData.length} prayers
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Download a template file, fill it with your prayer data, then upload it using the Upload File tab.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">Kingdom Focus Prayers</h3>
                  <p className="text-sm text-muted-foreground">
                    For daily intercessions with date scheduling (month, day, year, day_of_week, intercession_number)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadCSVTemplate('Kingdom Focus')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV Template
                    </Button>
                    <Button variant="outline" onClick={() => downloadJSONTemplate('Kingdom Focus')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON Template
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">Listening Prayer (Proverbs)</h3>
                  <p className="text-sm text-muted-foreground">
                    For 91-day Proverbs reading cycle (day_number, chapter, start_verse, end_verse, reference_text)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadCSVTemplate('Listening Prayer')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV Template
                    </Button>
                    <Button variant="outline" onClick={() => downloadJSONTemplate('Listening Prayer')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON Template
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
