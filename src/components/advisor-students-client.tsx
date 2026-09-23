"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddStudentDialog } from "@/components/add-student-dialog";
import Link from 'next/link';

interface Student {
  id: string;
  user: {
    name: string;
    email: string;
  };
  grade: string;
  domain: string | null;
  school: string | null;
  targetUniversities: string[];
  currentScore: number;
  targetScore: number;
  advisor?: {
    user: {
      name: string;
    };
  };
}

interface AdvisorStudentsClientProps {
  students: Student[];
  userRole: string | null;
  userName: string;
}

export function AdvisorStudentsClient({ students, userRole, userName }: AdvisorStudentsClientProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  const filteredStudents = selectedGrade === "all" 
    ? students 
    : students.filter(student => student.grade === selectedGrade);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Öğrenci Takibi</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>
        <div className="flex items-center gap-4">
          {userRole === 'SUPER_ADMIN' && (
            <Badge className="bg-purple-100 text-purple-700">SUPER ADMIN - Tüm Öğrenciler Görüntüleniyor</Badge>
          )}
          <AddStudentDialog />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle>Öğrenci Listesi</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sınıf Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sınıflar</SelectItem>
                <SelectItem value="9">9. Sınıf</SelectItem>
                <SelectItem value="10">10. Sınıf</SelectItem>
                <SelectItem value="11">11. Sınıf</SelectItem>
                <SelectItem value="12">12. Sınıf</SelectItem>
                <SelectItem value="Mezun">Mezun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Sınıf</TableHead>
                <TableHead>Alan</TableHead>
                <TableHead>Okul</TableHead>
                <TableHead>Hedef Üniversiteler</TableHead>
                <TableHead>Mevcut Puan</TableHead>
                <TableHead>Hedef Puan</TableHead>
                <TableHead>Danışman</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-lg font-medium">
                        {selectedGrade === "all" 
                          ? "Henüz size atanmış bir öğrenci bulunmamaktadır." 
                          : `${selectedGrade} sınıfında öğrenci bulunmamaktadır.`}
                      </p>
                      <p className="text-sm">Öğrenci eklemek için "Öğrenci Ekle" butonunu kullanabilirsiniz.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.user.name}</TableCell>
                    <TableCell>{student.user.email}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {student.domain || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.school}</TableCell>
                    <TableCell>
                      {student.targetUniversities && student.targetUniversities.length > 0
                        ? student.targetUniversities.slice(0, 2).join(', ') +
                          (student.targetUniversities.length > 2 ? ` (+${student.targetUniversities.length - 2})` : '')
                        : '-'}
                    </TableCell>
                    <TableCell>{student.currentScore}</TableCell>
                    <TableCell>{student.targetScore}</TableCell>
                    <TableCell>
                      {student.advisor ? student.advisor.user?.name : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/advisor/students/${student.id}`}>
                        <Button variant="outline" size="sm">
                          Detaylar
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}