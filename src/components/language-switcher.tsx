'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  // Note: This is a UI placeholder.
  // The logic to change the language is not implemented yet.
  return (
    <div className="flex items-center gap-2">
       <Languages className="h-5 w-5 text-muted-foreground hidden md:block" />
       <Select defaultValue="en">
        <SelectTrigger className="w-[100px] md:w-[140px] h-9">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ta">Tamil</SelectItem>
          <SelectItem value="hi">Hindi</SelectItem>
          <SelectItem value="bn">Bengali</SelectItem>
          <SelectItem value="te">Telugu</SelectItem>
          <SelectItem value="mr">Marathi</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
