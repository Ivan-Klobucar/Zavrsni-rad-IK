package com.app.backend.service;

import com.app.backend.dto.CardDTO;
import com.app.backend.dto.TurnStatisticsDTO;
import com.app.backend.model.GameState;
import org.openpdf.text.*;
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

            // Fontovi
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font highlightFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font dangerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

            // NASLOV
            Paragraph title = new Paragraph("Analiza Poteza i Upravljanje Resursima", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n"));

            // UVOD - Edukativni dio za komisiju
            document.add(new Paragraph("Kratki pregled: Ova igra temelji se na ekonomiji resursa. Čudovišta predstavljaju ključni kapital na ploči. Gubitak čudovišta bez adekvatne kompenzacije predstavlja strateški zaostatak.", normalFont));
            document.add(new Paragraph("--------------------------------------------------------------------------------------------------"));
            document.add(new Paragraph("\n"));

            TurnStatisticsDTO stats = gameState.getStatistics();
            if (stats != null) {
                // 1. EKONOMIJA ČUDOVIŠTA (Monster Sum)
                document.add(new Paragraph("1. Ekonomija Čudovišta (Monster Sum)", sectionFont));
                document.add(new Paragraph("Uništena protivnička čudovišta (+): " + stats.getMonstersDestroyed(), normalFont));
                document.add(new Paragraph("Izgubljena vlastita čudovišta (-): " + stats.getMonstersLost(), normalFont));

                if (stats.getHighAtkMonstersLost() > 0) {
                    document.add(new Paragraph("UPOZORENJE: Izgubljeno je " + stats.getHighAtkMonstersLost() + " čudovišta visoke snage napada!", dangerFont));
                }

                int sum = stats.getMonsterSum();
                Paragraph sumPara = new Paragraph("Ukupna suma poteza: " + sum, boldFont);
                document.add(sumPara);

                Paragraph verdictPara = new Paragraph("Ocjena poteza: " + stats.getTurnVerdict(), highlightFont);
                document.add(verdictPara);
                document.add(new Paragraph("\n"));

                // 2. LOGIKA POTEZA
                document.add(new Paragraph("2. Dnevnik Akcija i Posljedica", sectionFont));
                if (stats.getActionLog() != null && !stats.getActionLog().isEmpty()) {
                    for (String action : stats.getActionLog()) {
                        document.add(new Paragraph(" • " + action, normalFont));
                    }
                } else {
                    document.add(new Paragraph("Nije zabilježena značajna akcija u ovom potezu.", normalFont));
                }
                document.add(new Paragraph("\n"));

                // 3. AI ANALIZA
                document.add(new Paragraph("3. Analiza AI Savjetnika", sectionFont));
                int followedRate = stats.getAiFollowedTotal() > 0 ?
                        (stats.getAiFollowedSuccesses() * 100 / stats.getAiFollowedTotal()) : 0;
                int ignoredRate = stats.getAiIgnoredTotal() > 0 ?
                        (stats.getAiIgnoredSuccesses() * 100 / stats.getAiIgnoredTotal()) : 0;

                document.add(new Paragraph("Uspješnost kada je korisnik SLUŠAO AI: " + followedRate + "% (" + stats.getAiFollowedSuccesses() + "/" + stats.getAiFollowedTotal() + ")", normalFont));
                document.add(new Paragraph("Uspješnost kada je korisnik IGNORIRAO AI: " + ignoredRate + "% (" + stats.getAiIgnoredSuccesses() + "/" + stats.getAiIgnoredTotal() + ")", normalFont));

                if (followedRate > ignoredRate) {
                    document.add(new Paragraph("Zaključak: Praćenje AI savjeta pokazalo se kao optimalna strategija u ovom potezu.", highlightFont));
                } else if (ignoredRate > followedRate) {
                    document.add(new Paragraph("Zaključak: Korisnik je pronašao bolju alternativu od predložene AI strategije.", highlightFont));
                }
            } else {
                document.add(new Paragraph("Statistički podaci za ovaj potez nisu dostupni.", dangerFont));
            }

            document.add(new Paragraph("\n"));
            document.add(new Paragraph("--------------------------------------------------------------------------------------------------"));

            // 4. PREGLED PLOČE (Korisno za pregled nakon End Phase-a)
            document.add(new Paragraph("4. Trenutno Stanje Resursa", sectionFont));
            document.add(new Paragraph("Igrač Životni bodovi: " + gameState.getPlayer().getLifePoints(), normalFont));
            document.add(new Paragraph("Protivnik Životni bodovi: " + gameState.getOpponent().getLifePoints(), normalFont));

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }
}
