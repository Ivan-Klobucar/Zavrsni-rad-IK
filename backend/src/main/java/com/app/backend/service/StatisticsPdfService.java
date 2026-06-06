package com.app.backend.service;

import com.app.backend.dto.CardDTO;
import com.app.backend.dto.TurnStatisticsDTO;
import com.app.backend.model.GameState;
import org.openpdf.text.*;
import org.openpdf.text.pdf.BaseFont;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class StatisticsPdfService {

    public byte[] generateStatisticsPdf(GameState gameState) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. KLJUČNO: Govorimo sustavu da učita fontove s računala (Windows/Mac)
            FontFactory.registerDirectories();

            // Postavke za naša slova (Unicode i ugrađivanje fonta u PDF)
            String fontName = "Arial";
            String encoding = BaseFont.IDENTITY_H;
            boolean embedded = BaseFont.EMBEDDED;

            // 2. Definiranje Arial fontova s podrškom za č, ć, đ, š, ž
            Font titleFont = FontFactory.getFont(fontName, encoding, embedded, 18, Font.BOLD);
            Font sectionFont = FontFactory.getFont(fontName, encoding, embedded, 14, Font.BOLD);
            Font normalFont = FontFactory.getFont(fontName, encoding, embedded, 11, Font.NORMAL);
            Font boldFont = FontFactory.getFont(fontName, encoding, embedded, 11, Font.BOLD);

            // Boje za ocjene (sada koriste Arial Bold)
            Font uspjehFont = FontFactory.getFont(fontName, encoding, embedded, 12, Font.BOLD, new Color(0, 150, 0));
            Font losFont = FontFactory.getFont(fontName, encoding, embedded, 12, Font.BOLD, Color.RED);
            Font pasivanFont = FontFactory.getFont(fontName, encoding, embedded, 12, Font.BOLD, Color.BLUE);

            // NASLOV
            Paragraph title = new Paragraph("PROBABILISTIČKA ANALIZA I EVALUACIJA RESURSA", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n"));

            TurnStatisticsDTO stats = gameState.getStatistics();
            if (stats != null) {

                // 1. EKONOMIJA ČUDOVIŠTA (Weighted Counter)
                document.add(new Paragraph("1. Ekonomski Balans Čudovišta na Ploči", sectionFont));
                document.add(new Paragraph(" • Dobivena vlastita čudovišta: +" + stats.getMonstersGained(), normalFont));
                document.add(new Paragraph(" • Izgubljena vlastita čudovišta (<2000 ATK): -" + stats.getMonstersLostNormal(), normalFont));
                document.add(new Paragraph(" • Izgubljena kapitalna čudovišta (>=2000 ATK): -" + (stats.getMonstersLostBoss() * 2) + " (Količina: " + stats.getMonstersLostBoss() + ")", normalFont));
                document.add(new Paragraph(" • Uništena protivnička čudovišta (<2000 ATK): +" + stats.getMonstersDestroyedNormal(), normalFont));
                document.add(new Paragraph(" • Uništena protivnička kapitalna čudovišta (>=2000 ATK): +" + (stats.getMonstersDestroyedBoss() * 2) + " (Količina: " + stats.getMonstersDestroyedBoss() + ")", normalFont));

                // Formula za izračun sume
                int monsterSum = (stats.getMonstersGained() * 1)
                        + (stats.getMonstersDestroyedNormal() * 1)
                        + (stats.getMonstersDestroyedBoss() * 2)
                        - (stats.getMonstersLostNormal() * 1)
                        - (stats.getMonstersLostBoss() * 2);

                Paragraph sumPara = new Paragraph("Ukupni indeks ekonomske sume: " + monsterSum, boldFont);
                document.add(sumPara);

                // Ispis različitih stanja ovisno o sumi
                Paragraph verdictPara = new Paragraph();
                verdictPara.add(new Chunk("Ocjena taktičkog poteza: ", normalFont));
                if (monsterSum > 0) {
                    verdictPara.add(new Chunk("USPJEŠAN POTEZ (Ostvarena je prednost u resursima na ploči)", uspjehFont));
                } else if (monsterSum < 0) {
                    verdictPara.add(new Chunk("LOŠ POTEZ (Pretrpljen je kritičan gubitak resursa)", losFont));
                } else {
                    verdictPara.add(new Chunk("PASIVAN I SIGURAN POTEZ (Održan je status quo i stabilnost polja)", pasivanFont));
                }
                document.add(verdictPara);
                document.add(new Paragraph("\n"));

                // 2. DETALJNI DNEVNIK UNIŠTENJA
                document.add(new Paragraph("2. Specifikacija Uništenih Karata", sectionFont));
                if (stats.getDestructionLog() != null && !stats.getDestructionLog().isEmpty()) {
                    for (String logEntry : stats.getDestructionLog()) {
                        document.add(new Paragraph(logEntry, normalFont));
                    }
                } else {
                    document.add(new Paragraph(" • U ovom krugu nije zabilježeno uništenje čudovišta.", normalFont));
                }
                document.add(new Paragraph("\n"));

                // 3. USKLAĐENOST S AI-EM I EVALUACIJA INTUICIJE
                document.add(new Paragraph("3. Evaluacija Odluka i Usporedba s AI Agentom", sectionFont));
                document.add(new Paragraph(" • Broj situacija u kojima je korisnik PRATIO AI (Aktivno/Pasivno): " + stats.getAiFollowedCount(), normalFont));
                document.add(new Paragraph(" • Broj situacija u kojima je korisnik IGNORIRAO AI (Aktivno/Pasivno): " + stats.getAiIgnoredCount(), normalFont));

                document.add(new Paragraph("Strateški zaključak: ", boldFont));

                // DINAMIČKI IZRAČUN POVRATNE INFORMACIJE DIREKTNO U PDF-u
                String feedbackMessage = determineDynamicFeedback(stats, monsterSum);
                document.add(new Paragraph(" -> " + feedbackMessage, normalFont));

            } else {
                document.add(new Paragraph("Statistički podaci za ovaj potez nisu dostupni.", losFont));
            }

            document.add(new Paragraph("\n"));
            document.add(new Paragraph("--------------------------------------------------------------------------------------------------"));

            // 4. KONAČNO STANJE RESURSA
            document.add(new Paragraph("4. Trenutno Stanje Životnih Bodova", sectionFont));
            document.add(new Paragraph("Igrač LP: " + gameState.getPlayer().getLifePoints() + " | Protivnik LP: " + gameState.getOpponent().getLifePoints(), normalFont));
            document.add(new Paragraph("Dnevnik Akcija i Poteza (Match Log)", sectionFont));

            if (stats.getActionLog() != null && !stats.getActionLog().isEmpty()) {
                for (String log : stats.getActionLog()) {
                    document.add(new Paragraph(" " + log, normalFont));
                }
            } else {
                document.add(new Paragraph(" • Nema zabilježenih akcija u ovom krugu.", normalFont));
            }
            document.add(new Paragraph("\n"));
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }

    // NOVA METODA: Ovdje na licu mjesta određujemo poruku na temelju trenutnog stanja
    private String determineDynamicFeedback(TurnStatisticsDTO stats, int netAdvantage) {
        if (stats.getAiIgnoredCount() > stats.getAiFollowedCount()) {
            if (netAdvantage > 0) {
                return "Vrhunska intuicija! Preuzeo si rizik unatoč AI upozorenjima i nadmudrio protivnika.";
            } else if (netAdvantage < 0) {
                return "Rizična igra se ovaj put nije isplatila. AI upozorenja su bila točna.";
            } else {
                return "Dosta riskantnih poteza, ali situacija na ploči je ostala izjednačena.";
            }
        } else if (stats.getAiFollowedCount() > stats.getAiIgnoredCount()) {
            if (netAdvantage > 0) {
                return "Pametna i taktička igra! Praćenje šansi se itekako isplatilo.";
            } else if (netAdvantage < 0) {
                return "Igrao si na sigurno, ali protivnik je imao sreće (ili skrivene asove).";
            } else {
                return "Strpljiva igra, čekaš pravu priliku za napad.";
            }
        } else {
            if (netAdvantage > 0) {
                return "Dobar potez, polako gradiš prednost na ploči.";
            } else {
                return "Relativno miran potez bez većih oscilacija.";
            }
        }
    }
}